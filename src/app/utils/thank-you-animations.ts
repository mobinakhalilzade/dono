import {
  CreatorAnimationConfig,
  ThankYouAnimationId,
  ThankYouAnimationPack,
} from '../models/dono.models';
import { formatToman } from './formatters';

export const MAX_THANK_YOU_NOTE_LENGTH = 220;

export const THANK_YOU_ANIMATION_CATALOG: readonly ThankYouAnimationPack[] = [
  {
    id: 'standard',
    name: 'تشکر استاندارد دونو',
    subtitle: 'نمایش پیام تایید ساده روی صفحه',
    description: 'پس از ثبت حمایت، یک پیام تایید تمیز و ساده در فرم حمایت نمایش داده می‌شود.',
    priceToman: 0,
    isPremium: false,
    accentColor: '#3B3A9E',
    secondaryColor: '#A5A6F6',
    badgeLabel: 'رایگان',
  },
  {
    id: 'confetti-celebration',
    name: 'جشن کاغذرنگی و ستاره‌ها',
    subtitle: 'بارش ربان‌های نیلی، مرجانی و طلایی',
    description:
      'پس از پرداخت حامی، دو توپخانه کاغذرنگی و ستاره درخشنده سراسر صفحه را با کارت سپاسگزاری پر می‌کنند.',
    priceToman: 120_000,
    isPremium: true,
    accentColor: '#3B3A9E',
    secondaryColor: '#EF6A4C',
    badgeLabel: 'پرطرفدار',
  },
  {
    id: 'coral-hearts',
    name: 'باران قلب و جرقه نور',
    subtitle: 'قلب‌های شناور مرجانی با درخشش گرم',
    description:
      'ده‌ها قلب نورانی و جرقه‌های مرجانی از پایین به بالا اوج می‌گیرند و حس قدردانی صمیمانه منتقل می‌کنند.',
    priceToman: 180_000,
    isPremium: true,
    accentColor: '#EF6A4C',
    secondaryColor: '#FF8A70',
    badgeLabel: 'صمیمی',
  },
  {
    id: 'fireworks-gala',
    name: 'آتش‌بازی کهکشانی',
    subtitle: 'انفجارهای هماهنگ نور در شب پرستاره',
    description:
      'فشفشه‌های رنگی پشت‌سرهم اوج می‌گیرند و با موج نورانی و ذرات درخشان جشن حمایت را ماندگار می‌کنند.',
    priceToman: 250_000,
    isPremium: true,
    accentColor: '#A5A6F6',
    secondaryColor: '#FF8A70',
    badgeLabel: 'جشنواره',
  },
  {
    id: 'golden-trophy',
    name: 'تندیس طلایی و هاله ستاره',
    subtitle: 'پرتوهای طلایی و بارش ستاره ویژه حامیان',
    description:
      'تندیس طلایی حامی بر فراز هاله چرخان ستاره‌ها ظاهر می‌شود و بارش ذرات طلایی از حامی قدردانی می‌کند.',
    priceToman: 320_000,
    isPremium: true,
    accentColor: '#D97706',
    secondaryColor: '#FBBF24',
    badgeLabel: 'لوکس',
  },
];

export function getAnimationPackById(id: ThankYouAnimationId | string): ThankYouAnimationPack {
  return (
    THANK_YOU_ANIMATION_CATALOG.find((pack) => pack.id === id) ??
    THANK_YOU_ANIMATION_CATALOG[0]
  );
}

export function hasOwnedAnimation(
  ownedIds: readonly ThankYouAnimationId[],
  animationId: ThankYouAnimationId,
): boolean {
  if (animationId === 'standard') return true;
  return ownedIds.includes(animationId);
}

export interface AnimationPurchaseResult {
  ok: boolean;
  error?: string;
  updatedConfig?: CreatorAnimationConfig;
  spentFromBalance?: number;
}

export function purchaseAnimationForConfig(
  current: CreatorAnimationConfig,
  animationId: ThankYouAnimationId,
  availableBalance: number,
  paymentSource: 'balance' | 'direct',
): AnimationPurchaseResult {
  const pack = THANK_YOU_ANIMATION_CATALOG.find((p) => p.id === animationId);
  if (!pack) {
    return { ok: false, error: 'انیمیشن انتخاب‌شده یافت نشد.' };
  }
  if (hasOwnedAnimation(current.ownedIds, animationId)) {
    return {
      ok: true,
      spentFromBalance: 0,
      updatedConfig: {
        ...current,
        activeId: animationId,
      },
    };
  }
  if (paymentSource === 'balance' && availableBalance < pack.priceToman) {
    return {
      ok: false,
      error: `موجودی قابل تسویه (${formatToman(availableBalance)}) برای خرید این انیمیشن (${formatToman(pack.priceToman)}) کافی نیست.`,
    };
  }

  const nextOwned = Array.from(new Set<ThankYouAnimationId>(['standard', ...current.ownedIds, animationId]));
  return {
    ok: true,
    spentFromBalance: paymentSource === 'balance' ? pack.priceToman : 0,
    updatedConfig: {
      ...current,
      ownedIds: nextOwned,
      activeId: animationId,
    },
  };
}

export function activateAnimationForConfig(
  current: CreatorAnimationConfig,
  animationId: ThankYouAnimationId,
): { ok: boolean; error?: string; updatedConfig?: CreatorAnimationConfig } {
  if (!hasOwnedAnimation(current.ownedIds, animationId)) {
    return { ok: false, error: 'ابتدا باید این انیمیشن را خریداری کنید.' };
  }
  return {
    ok: true,
    updatedConfig: {
      ...current,
      activeId: animationId,
    },
  };
}

export function validateThankYouNote(note: string): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = note.trim();
  if (cleaned.length > MAX_THANK_YOU_NOTE_LENGTH) {
    return {
      valid: false,
      cleaned,
      error: `متن پیام تشکر نباید بیشتر از ${MAX_THANK_YOU_NOTE_LENGTH} کاراکتر باشد.`,
    };
  }
  return { valid: true, cleaned };
}
