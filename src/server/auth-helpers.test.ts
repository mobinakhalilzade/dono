import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleAuthUrl,
  escapeHtmlJson,
  parseCookies,
  resolveAppOrigin,
  signPayload,
  verifySignedPayload,
} from './auth-helpers';
import { isAllowedPopupOrigin } from '../app/utils/auth-utils';

test('resolveAppOrigin prioritizes APP_URL env and strips trailing slash', () => {
  const origin = resolveAppOrigin('https://ais-dev-example.run.app/', {
    host: 'localhost:3000',
  });
  assert.equal(origin, 'https://ais-dev-example.run.app');
});

test('resolveAppOrigin falls back to forwarded headers or localhost', () => {
  assert.equal(
    resolveAppOrigin(undefined, {
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'ais-pre-example.run.app',
    }),
    'https://ais-pre-example.run.app',
  );
  assert.equal(
    resolveAppOrigin(undefined, { host: 'localhost:3000' }),
    'http://localhost:3000',
  );
});

test('parseCookies decodes multiple cookies safely', () => {
  const parsed = parseCookies('foo=bar; dono_session=abc%2E123; empty=');
  assert.equal(parsed['foo'], 'bar');
  assert.equal(parsed['dono_session'], 'abc.123');
  assert.equal(parsed['empty'], '');
});

test('signPayload and verifySignedPayload validate signature and expiry', () => {
  const secret = 'test-secret-key';
  const now = 1_700_000_000_000;
  const token = signPayload({ id: 'google-123', exp: now + 60_000 }, secret);

  const valid = verifySignedPayload<{ id: string; exp: number }>(token, secret, now + 10_000);
  assert.equal(valid?.id, 'google-123');

  const expired = verifySignedPayload(token, secret, now + 120_000);
  assert.equal(expired, null);

  const tampered = verifySignedPayload(`${token}x`, secret, now + 10_000);
  assert.equal(tampered, null);
});

test('buildGoogleAuthUrl includes required Google OAuth parameters', () => {
  const url = new URL(
    buildGoogleAuthUrl({
      clientId: 'my-client-id',
      redirectUri: 'https://ais-dev-example.run.app/auth/callback',
      state: 'signed-state',
    }),
  );
  assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('client_id'), 'my-client-id');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://ais-dev-example.run.app/auth/callback');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('scope'), 'openid email profile');
  assert.equal(url.searchParams.get('state'), 'signed-state');
});

test('isAllowedPopupOrigin permits localhost, run.app, and current origin', () => {
  assert.equal(isAllowedPopupOrigin('https://ais-dev-123.europe-west2.run.app'), true);
  assert.equal(isAllowedPopupOrigin('http://localhost:3000'), true);
  assert.equal(isAllowedPopupOrigin('https://evil.example.com'), false);
  assert.equal(
    isAllowedPopupOrigin('https://custom.dono.com', 'https://custom.dono.com'),
    true,
  );
});

test('escapeHtmlJson neutralizes script-breaking HTML characters', () => {
  const serialized = escapeHtmlJson({ name: '</script><script>alert(1)</script>' });
  assert.ok(!serialized.includes('</script>'));
  assert.ok(serialized.includes('\\u003c/script\\u003e'));
});
