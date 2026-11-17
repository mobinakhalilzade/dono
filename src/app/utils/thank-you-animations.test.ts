import assert from 'node:assert/strict';
import test from 'node:test';
import {
  THANK_YOU_ANIMATION_CATALOG,
  activateAnimationForConfig,
  getAnimationPackById,
  hasOwnedAnimation,
  purchaseAnimationForConfig,
  validateThankYouNote,
} from './thank-you-animations';

test('THANK_YOU_ANIMATION_CATALOG includes free standard and 4 premium animations', () => {
  assert.equal(THANK_YOU_ANIMATION_CATALOG.length, 5);
  assert.equal(getAnimationPackById('standard').isPremium, false);
  assert.equal(getAnimationPackById('standard').priceToman, 0);
  const premiumCount = THANK_YOU_ANIMATION_CATALOG.filter((p) => p.isPremium).length;
  assert.equal(premiumCount, 4);
});

test('purchaseAnimationForConfig blocks balance purchase if balance is insufficient', () => {
  const initial = {
    creatorUsername: 'new_user',
    ownedIds: ['standard' as const],
    activeId: 'standard' as const,
    thankYouNote: '',
  };

  const failed = purchaseAnimationForConfig(initial, 'fireworks-gala', 100_000, 'balance');
  assert.equal(failed.ok, false);
  assert.ok(failed.error);
});

test('purchaseAnimationForConfig unlocks and activates animation via balance or direct checkout', () => {
  const initial = {
    creatorUsername: 'sara_art',
    ownedIds: ['standard' as const],
    activeId: 'standard' as const,
    thankYouNote: '',
  };

  const viaBalance = purchaseAnimationForConfig(initial, 'coral-hearts', 500_000, 'balance');
  assert.equal(viaBalance.ok, true);
  assert.equal(viaBalance.spentFromBalance, 180_000);
  assert.equal(viaBalance.updatedConfig?.activeId, 'coral-hearts');
  assert.equal(hasOwnedAnimation(viaBalance.updatedConfig!.ownedIds, 'coral-hearts'), true);

  const viaDirect = purchaseAnimationForConfig(viaBalance.updatedConfig!, 'golden-trophy', 0, 'direct');
  assert.equal(viaDirect.ok, true);
  assert.equal(viaDirect.spentFromBalance, 0);
  assert.equal(viaDirect.updatedConfig?.activeId, 'golden-trophy');
  assert.equal(hasOwnedAnimation(viaDirect.updatedConfig!.ownedIds, 'coral-hearts'), true);
});

test('activateAnimationForConfig prevents activating unowned animations', () => {
  const cfg = {
    creatorUsername: 'sara_art',
    ownedIds: ['standard' as const, 'confetti-celebration' as const],
    activeId: 'standard' as const,
    thankYouNote: '',
  };

  const denied = activateAnimationForConfig(cfg, 'golden-trophy');
  assert.equal(denied.ok, false);

  const allowed = activateAnimationForConfig(cfg, 'confetti-celebration');
  assert.equal(allowed.ok, true);
  assert.equal(allowed.updatedConfig?.activeId, 'confetti-celebration');
});

test('validateThankYouNote enforces maximum length and trims cleanly', () => {
  assert.deepEqual(validateThankYouNote('  ممنون از همراهی ارزشمندتان!  '), {
    valid: true,
    cleaned: 'ممنون از همراهی ارزشمندتان!',
  });

  const tooLong = validateThankYouNote('ا'.repeat(230));
  assert.equal(tooLong.valid, false);
  assert.ok(tooLong.error);
});
