import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SignedOAuthState {
  nonce: string;
  exp: number;
}

export interface ServerSessionUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  provider: 'google';
  exp: number;
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const raw = headers[name.toLowerCase()] ?? headers[name];
  if (Array.isArray(raw)) {
    return raw[0]?.split(',')[0]?.trim();
  }
  return raw?.split(',')[0]?.trim();
}

export function resolveAppOrigin(
  appUrlEnv: string | undefined,
  headers: Record<string, string | string[] | undefined>,
  fallbackOrigin = 'http://localhost:3000',
): string {
  const configured = appUrlEnv?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  const forwardedHost = getHeaderValue(headers, 'x-forwarded-host');
  const host = forwardedHost || getHeaderValue(headers, 'host');
  const forwardedProto = getHeaderValue(headers, 'x-forwarded-proto');

  if (host) {
    const isLocal =
      host.startsWith('localhost') ||
      host.startsWith('127.0.0.1') ||
      host.startsWith('0.0.0.0');
    const proto = forwardedProto || (isLocal ? 'http' : 'https');
    return `${proto}://${host}`.replace(/\/+$/, '');
  }

  return fallbackOrigin.replace(/\/+$/, '');
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) {
    return result;
  }

  for (const part of cookieHeader.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = part.slice(0, eqIndex).trim();
    const rawValue = part.slice(eqIndex + 1).trim();
    if (!key) continue;
    try {
      result[key] = decodeURIComponent(rawValue);
    } catch {
      result[key] = rawValue;
    }
  }
  return result;
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64');
}

export function signPayload(payload: object, secret: string): string {
  const body = toBase64Url(JSON.stringify(payload));
  const sig = toBase64Url(createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySignedPayload<T extends { exp?: number }>(
  token: string | undefined,
  secret: string,
  nowMs = Date.now(),
): T | null {
  if (!token) return null;
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;

  const body = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!body || !sig) return null;

  const expectedSig = toBase64Url(createHmac('sha256', secret).update(body).digest());
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(body).toString('utf8')) as T;
    if (typeof parsed.exp === 'number' && parsed.exp < nowMs) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function buildGoogleAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const query = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state: params.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`;
}

export function escapeHtmlJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
