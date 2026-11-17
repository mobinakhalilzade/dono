import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { type CookieOptions, type Request, type Response } from 'express';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import {
  buildGoogleAuthUrl,
  escapeHtmlJson,
  parseCookies,
  resolveAppOrigin,
  type ServerSessionUser,
  type SignedOAuthState,
  signPayload,
  verifySignedPayload,
} from './server/auth-helpers';

const browserDistFolder = join(import.meta.dirname, '../browser');

const SESSION_COOKIE_NAME = 'dono_session';
const OAUTH_STATE_COOKIE_NAME = 'dono_oauth_state';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['*'],
  trustProxyHeaders: true,
});

function getSessionSecret(): string {
  return (
    process.env['SESSION_SECRET']?.trim() ||
    process.env['GOOGLE_CLIENT_SECRET']?.trim() ||
    'dono-dev-session-secret-change-in-production'
  );
}

function getRequestOrigin(req: Request): string {
  return resolveAppOrigin(
    process.env['APP_URL'],
    req.headers as Record<string, string | string[] | undefined>,
  );
}

function getCookieOptions(req: Request, maxAge?: number): CookieOptions {
  const origin = getRequestOrigin(req);
  const isHttps = origin.startsWith('https://');
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  };
}

function getOAuthCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env['GOOGLE_CLIENT_ID']?.trim();
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET']?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret };
}

function renderPopupResultHtml(payload: Record<string, unknown>, messageFa: string): string {
  const safeJson = escapeHtmlJson(payload);
  return `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>احراز هویت دونو</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, -apple-system, sans-serif;
        background: #F8F8FC;
        color: #14142B;
        padding: 1.5rem;
        text-align: center;
      }
      .box {
        max-width: 360px;
        background: #FFFFFF;
        border: 1px solid rgba(20, 20, 43, 0.12);
        border-radius: 16px;
        padding: 1.5rem;
      }
      a {
        display: inline-block;
        margin-top: 1rem;
        color: #3B3A9E;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div class="box">
      <p>${messageFa}</p>
      <a href="/login">بازگشت به دونو</a>
    </div>
    <script>
      (function () {
        var payload = ${safeJson};
        if (window.opener) {
          window.opener.postMessage(payload, '*');
          window.close();
        } else if (payload && payload.type === 'GOOGLE_AUTH_SUCCESS') {
          window.location.href = '/onboarding';
        }
      })();
    </script>
  </body>
</html>`;
}

app.get('/api/auth/status', (req: Request, res: Response) => {
  const creds = getOAuthCredentials();
  const callbackUrl = `${getRequestOrigin(req)}/auth/callback`;
  res.json({
    configured: Boolean(creds),
    callbackUrl,
  });
});

app.get('/api/auth/google/url', (req: Request, res: Response) => {
  const creds = getOAuthCredentials();
  const callbackUrl = `${getRequestOrigin(req)}/auth/callback`;

  if (!creds) {
    res.status(200).json({
      configured: false,
      error: 'OAUTH_NOT_CONFIGURED',
      message:
        'ورود با گوگل هنوز پیکربندی نشده است. متغیرهای محیطی GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET را تنظیم کنید.',
      callbackUrl,
    });
    return;
  }

  const secret = getSessionSecret();
  const stateToken = signPayload(
    {
      nonce: randomBytes(16).toString('hex'),
      exp: Date.now() + OAUTH_STATE_MAX_AGE_MS,
    } satisfies SignedOAuthState,
    secret,
  );

  res.cookie(
    OAUTH_STATE_COOKIE_NAME,
    stateToken,
    getCookieOptions(req, OAUTH_STATE_MAX_AGE_MS),
  );

  const url = buildGoogleAuthUrl({
    clientId: creds.clientId,
    redirectUri: callbackUrl,
    state: stateToken,
  });

  res.json({ configured: true, url, callbackUrl });
});

async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  const oauthError = typeof req.query['error'] === 'string' ? req.query['error'] : undefined;
  if (oauthError) {
    const msg =
      oauthError === 'access_denied'
        ? 'دسترسی حساب گوگل توسط شما لغو شد.'
        : 'احراز هویت گوگل با خطا مواجه شد.';
    res.status(200).send(renderPopupResultHtml({ type: 'GOOGLE_AUTH_ERROR', message: msg }, msg));
    return;
  }

  const creds = getOAuthCredentials();
  if (!creds) {
    const msg = 'تنظیمات ورود با گوگل روی سرور کامل نیست.';
    res.status(503).send(renderPopupResultHtml({ type: 'GOOGLE_AUTH_ERROR', message: msg }, msg));
    return;
  }

  const code = typeof req.query['code'] === 'string' ? req.query['code'] : undefined;
  const stateParam = typeof req.query['state'] === 'string' ? req.query['state'] : undefined;
  const secret = getSessionSecret();
  const cookies = parseCookies(req.headers.cookie);
  const stateCookie = cookies[OAUTH_STATE_COOKIE_NAME];

  const verifiedState = verifySignedPayload<SignedOAuthState>(stateParam, secret);
  if (!code || !verifiedState || (stateCookie && stateCookie !== stateParam)) {
    const msg = 'نشست احراز هویت نامعتبر یا منقضی شده است. لطفاً دوباره تلاش کنید.';
    res.status(400).send(renderPopupResultHtml({ type: 'GOOGLE_AUTH_ERROR', message: msg }, msg));
    return;
  }

  const callbackUrl = `${getRequestOrigin(req)}/auth/callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Google token exchange failed:', tokenRes.status, errText);
      const msg = 'دریافت توکن از گوگل ناموفق بود. لطفاً دوباره امتحان کنید.';
      res.status(502).send(renderPopupResultHtml({ type: 'GOOGLE_AUTH_ERROR', message: msg }, msg));
      return;
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      const msg = 'توکن دسترسی گوگل دریافت نشد.';
      res.status(502).send(renderPopupResultHtml({ type: 'GOOGLE_AUTH_ERROR', message: msg }, msg));
      return;
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileRes.ok) {
      const msg = 'دریافت اطلاعات پروفایل گوگل ناموفق بود.';
      res.status(502).send(renderPopupResultHtml({ type: 'GOOGLE_AUTH_ERROR', message: msg }, msg));
      return;
    }

    const profile = (await profileRes.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!profile.sub || !profile.email) {
      const msg = 'اطلاعات ایمیل از حساب گوگل دریافت نشد.';
      res.status(400).send(renderPopupResultHtml({ type: 'GOOGLE_AUTH_ERROR', message: msg }, msg));
      return;
    }

    const sessionUser: ServerSessionUser = {
      id: `google-${profile.sub}`,
      email: profile.email,
      displayName: profile.name?.trim() || profile.email.split('@')[0] || 'کاربر دونو',
      avatarUrl: profile.picture || '',
      provider: 'google',
      exp: Date.now() + SESSION_MAX_AGE_MS,
    };

    const sessionToken = signPayload(sessionUser, secret);
    res.clearCookie(OAUTH_STATE_COOKIE_NAME, getCookieOptions(req));
    res.cookie(SESSION_COOKIE_NAME, sessionToken, getCookieOptions(req, SESSION_MAX_AGE_MS));

    const publicUser = {
      id: sessionUser.id,
      email: sessionUser.email,
      displayName: sessionUser.displayName,
      avatarUrl: sessionUser.avatarUrl,
      provider: 'google' as const,
    };

    res.status(200).send(
      renderPopupResultHtml(
        { type: 'GOOGLE_AUTH_SUCCESS', user: publicUser },
        'ورود با گوگل با موفقیت انجام شد. این پنجره به‌صورت خودکار بسته می‌شود.',
      ),
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const msg = 'خطای غیرمنتظره در ارتباط با گوگل رخ داد.';
    res.status(500).send(renderPopupResultHtml({ type: 'GOOGLE_AUTH_ERROR', message: msg }, msg));
  }
}

app.get(['/auth/callback', '/auth/callback/'], handleGoogleCallback);

app.get('/api/auth/me', (req: Request, res: Response) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = verifySignedPayload<ServerSessionUser>(
    cookies[SESSION_COOKIE_NAME],
    getSessionSecret(),
  );

  if (!session) {
    res.json({ user: null });
    return;
  }

  res.json({
    user: {
      id: session.id,
      email: session.email,
      displayName: session.displayName,
      avatarUrl: session.avatarUrl,
      provider: session.provider,
    },
  });
});

app.post(['/users/register', '/api/users/register'], (req: Request, res: Response) => {
  const { firstName, lastName, username, phoneNumber, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });
    return;
  }
  const cleanUsername = String(username).replace(/^@/, '').trim().toLowerCase();
  const sessionUser: ServerSessionUser = {
    id: `usr-cred-${cleanUsername}`,
    email: `${cleanUsername}@dono.ir`,
    displayName: `${firstName || ''} ${lastName || ''}`.trim() || cleanUsername,
    avatarUrl: '',
    provider: 'credentials',
    exp: Date.now() + SESSION_MAX_AGE_MS,
  };
  const sessionToken = signPayload(sessionUser, getSessionSecret());
  res.cookie(SESSION_COOKIE_NAME, sessionToken, getCookieOptions(req, SESSION_MAX_AGE_MS));
  res.json({ ok: true, user: sessionUser });
});

app.post(['/users/login', '/api/users/login'], (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });
    return;
  }
  const cleanUsername = String(username).replace(/^@/, '').trim().toLowerCase();
  const sessionUser: ServerSessionUser = {
    id: `usr-cred-${cleanUsername}`,
    email: `${cleanUsername}@dono.ir`,
    displayName: cleanUsername,
    avatarUrl: '',
    provider: 'credentials',
    exp: Date.now() + SESSION_MAX_AGE_MS,
  };
  const sessionToken = signPayload(sessionUser, getSessionSecret());
  res.cookie(SESSION_COOKIE_NAME, sessionToken, getCookieOptions(req, SESSION_MAX_AGE_MS));
  res.json({ ok: true, user: sessionUser });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE_NAME, getCookieOptions(req));
  res.clearCookie(OAUTH_STATE_COOKIE_NAME, getCookieOptions(req));
  res.json({ ok: true });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT']) || 3000;
  app.listen(port, '0.0.0.0', (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://0.0.0.0:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
