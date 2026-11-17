import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlatformIntentUrl, buildPlatformShareOptions } from './share-snippets';

test('buildPlatformShareOptions builds tailored snippets for X, Instagram, LinkedIn, Telegram, and WhatsApp', () => {
  const options = buildPlatformShareOptions({
    displayName: 'سارا محمدی',
    username: '@Sara_Art',
  });

  assert.equal(options.length, 5);
  assert.deepEqual(
    options.map((o) => o.id),
    ['x', 'instagram', 'linkedin', 'telegram', 'whatsapp'],
  );

  const xOpt = options.find((o) => o.id === 'x')!;
  const igOpt = options.find((o) => o.id === 'instagram')!;
  const liOpt = options.find((o) => o.id === 'linkedin')!;
  const tgOpt = options.find((o) => o.id === 'telegram')!;
  const waOpt = options.find((o) => o.id === 'whatsapp')!;

  assert.ok(xOpt.defaultSnippet.includes('https://dono.com/@sara_art'));
  assert.ok(xOpt.defaultSnippet.includes('#دونو'));
  assert.ok(igOpt.defaultSnippet.includes('dono.com/@sara_art'));
  assert.ok(igOpt.defaultSnippet.includes('کد QR'));
  assert.equal(igOpt.actionLabel, null);
  assert.ok(liOpt.defaultSnippet.includes('سارا محمدی'));
  assert.ok(liOpt.defaultSnippet.includes('#تولید_محتوا'));
  assert.ok(tgOpt.defaultSnippet.includes('https://dono.com/@sara_art'));
  assert.ok(waOpt.defaultSnippet.includes('https://dono.com/@sara_art'));
  assert.notEqual(xOpt.defaultSnippet, liOpt.defaultSnippet);
  assert.notEqual(igOpt.defaultSnippet, waOpt.defaultSnippet);
});

test('buildPlatformIntentUrl generates valid web intents and returns null for Instagram', () => {
  const shareUrl = 'https://dono.com/@ali_code';
  const snippet = 'حمایت از علی رضایی در دونو';

  const xUrl = new URL(buildPlatformIntentUrl('x', snippet, shareUrl)!);
  assert.equal(xUrl.origin + xUrl.pathname, 'https://twitter.com/intent/tweet');
  assert.equal(xUrl.searchParams.get('text'), snippet);

  const liUrl = new URL(buildPlatformIntentUrl('linkedin', snippet, shareUrl)!);
  assert.equal(liUrl.origin + liUrl.pathname, 'https://www.linkedin.com/sharing/share-offsite/');
  assert.equal(liUrl.searchParams.get('url'), shareUrl);

  const tgUrl = new URL(buildPlatformIntentUrl('telegram', snippet, shareUrl)!);
  assert.equal(tgUrl.origin + tgUrl.pathname, 'https://t.me/share/url');
  assert.equal(tgUrl.searchParams.get('url'), shareUrl);
  assert.equal(tgUrl.searchParams.get('text'), snippet);

  const waUrl = new URL(buildPlatformIntentUrl('whatsapp', snippet, shareUrl)!);
  assert.equal(waUrl.origin, 'https://wa.me');
  assert.equal(waUrl.searchParams.get('text'), snippet);

  assert.equal(buildPlatformIntentUrl('instagram', snippet, shareUrl), null);
});
