import { CreatorPost, PostKind } from '../models/dono.models';
import { MIN_SUPPORT_TOMAN, formatToman } from './formatters';

export const MAX_GOAL_TARGET_TOMAN = 5_000_000_000;
export const QUICK_GOAL_TARGETS = [5_000_000, 10_000_000, 20_000_000, 50_000_000] as const;

export function getGoalRemainingAmount(post: Pick<CreatorPost, 'kind' | 'targetAmount' | 'raisedAmount'>): number | null {
  if (post.kind !== 'goal' || typeof post.targetAmount !== 'number' || post.targetAmount <= 0) {
    return null;
  }
  return Math.max(0, post.targetAmount - Math.max(0, post.raisedAmount));
}

export function getGoalProgressPercent(post: Pick<CreatorPost, 'kind' | 'targetAmount' | 'raisedAmount'>): number | null {
  if (post.kind !== 'goal' || typeof post.targetAmount !== 'number' || post.targetAmount <= 0) {
    return null;
  }
  const ratio = (Math.max(0, post.raisedAmount) / post.targetAmount) * 100;
  return Math.min(100, Math.max(0, Math.round(ratio)));
}

export function isGoalCompleted(post: Pick<CreatorPost, 'kind' | 'targetAmount' | 'raisedAmount'>): boolean {
  const remaining = getGoalRemainingAmount(post);
  return remaining !== null && remaining <= 0;
}

export function validatePostDonationLimit(
  post: Pick<CreatorPost, 'kind' | 'targetAmount' | 'raisedAmount'> | null | undefined,
  amount: number,
): string | null {
  if (!post || post.kind !== 'goal') {
    return null;
  }
  const remaining = getGoalRemainingAmount(post);
  if (remaining === null) {
    return null;
  }
  if (remaining <= 0) {
    return 'سقف مبلغ این هدف مالی به طور کامل تامین شده است.';
  }
  if (amount > remaining) {
    return `حداکثر مبلغ مجاز برای تکمیل این هدف ${formatToman(remaining)} است.`;
  }
  return null;
}

export interface CreatorPostInput {
  kind: PostKind;
  title: string;
  content: string;
  targetAmount?: number | null;
}

export function validateCreatorPostInput(input: CreatorPostInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.title.trim().length < 4) {
    errors['title'] = 'عنوان پست باید حداقل ۴ کاراکتر باشد.';
  }
  if (input.content.trim().length < 15) {
    errors['content'] = 'توضیحات پست باید حداقل ۱۵ کاراکتر باشد.';
  }
  if (input.kind === 'goal') {
    const target = Number(input.targetAmount);
    if (!Number.isFinite(target) || target < MIN_SUPPORT_TOMAN) {
      errors['targetAmount'] = `سقف مبلغ هدف باید حداقل ${formatToman(MIN_SUPPORT_TOMAN)} باشد.`;
    } else if (target > MAX_GOAL_TARGET_TOMAN) {
      errors['targetAmount'] = `حداکثر سقف مبلغ هدف ${formatToman(MAX_GOAL_TARGET_TOMAN)} است.`;
    }
  }
  return errors;
}
