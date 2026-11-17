import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getGoalProgressPercent,
  getGoalRemainingAmount,
  isGoalCompleted,
  validateCreatorPostInput,
  validatePostDonationLimit,
} from './post-goals';

test('getGoalRemainingAmount and progress return null for general posts without limit', () => {
  const general = { kind: 'general' as const, raisedAmount: 2_500_000 };
  assert.equal(getGoalRemainingAmount(general), null);
  assert.equal(getGoalProgressPercent(general), null);
  assert.equal(isGoalCompleted(general), false);
  assert.equal(validatePostDonationLimit(general, 5_000_000), null);
});

test('getGoalProgressPercent and remaining compute capped progress accurately', () => {
  const goal = { kind: 'goal' as const, targetAmount: 10_000_000, raisedAmount: 4_000_000 };
  assert.equal(getGoalRemainingAmount(goal), 6_000_000);
  assert.equal(getGoalProgressPercent(goal), 40);
  assert.equal(isGoalCompleted(goal), false);
});

test('validatePostDonationLimit enforces remaining limit on goal posts and blocks completed goals', () => {
  const activeGoal = { kind: 'goal' as const, targetAmount: 5_000_000, raisedAmount: 4_500_000 };
  assert.equal(validatePostDonationLimit(activeGoal, 500_000), null);
  assert.ok(validatePostDonationLimit(activeGoal, 600_000));

  const doneGoal = { kind: 'goal' as const, targetAmount: 5_000_000, raisedAmount: 5_000_000 };
  assert.equal(isGoalCompleted(doneGoal), true);
  assert.ok(validatePostDonationLimit(doneGoal, 50_000));
});

test('validateCreatorPostInput requires targetAmount only for goal posts', () => {
  const generalOk = validateCreatorPostInput({
    kind: 'general',
    title: 'حمایت عمومی از فعالیت‌ها',
    content: 'از حمایت همیشگی شما برای ادامه تولید محتوای مستقل سپاسگزارم.',
    targetAmount: null,
  });
  assert.deepEqual(generalOk, {});

  const goalMissingTarget = validateCreatorPostInput({
    kind: 'goal',
    title: 'سفر عکاسی پاییزی',
    content: 'برای ثبت مجموعه عکس‌های پاییزی در شمال کشور نیاز به تامین هزینه سفر دارم.',
    targetAmount: 0,
  });
  assert.ok(goalMissingTarget['targetAmount']);

  const goalValid = validateCreatorPostInput({
    kind: 'goal',
    title: 'خرید تبلت طراحی',
    content: 'این تبلت کمک می‌کند تصویرسازی‌های باکیفیت‌تر و سریع‌تری آماده کنم.',
    targetAmount: 15_000_000,
  });
  assert.deepEqual(goalValid, {});
});
