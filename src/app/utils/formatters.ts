const PERSIAN_NUMBER_FORMATTER = new Intl.NumberFormat('fa-IR');
const JALALI_DATE_FORMATTER = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const JALALI_SHORT_FORMATTER = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  month: 'short',
  day: 'numeric',
});

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const MIN_SUPPORT_TOMAN = 10_000;
export const MAX_SUPPORT_TOMAN = 50_000_000;
export const QUICK_SUPPORT_AMOUNTS = [50_000, 100_000, 200_000, 500_000] as const;

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function formatNumberFa(value: number): string {
  if (!Number.isFinite(value)) {
    return '۰';
  }
  return PERSIAN_NUMBER_FORMATTER.format(Math.round(value));
}

export function formatToman(amount: number): string {
  return `${formatNumberFa(amount)} تومان`;
}

export function formatJalaliDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'نامشخص';
  }
  return JALALI_DATE_FORMATTER.format(date);
}

export function formatJalaliShort(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'نامشخص';
  }
  return JALALI_SHORT_FORMATTER.format(date);
}

export function getCreatorDisplayUrl(username: string): string {
  const clean = username.replace(/^@/, '').trim().toLowerCase();
  return `dono.com/@${clean}`;
}

export function getCreatorShareUrl(username: string): string {
  return `https://${getCreatorDisplayUrl(username)}`;
}

export function validateSupportAmount(amount: number, minAmount = MIN_SUPPORT_TOMAN): string | null {
  const effectiveMin = Math.max(MIN_SUPPORT_TOMAN, minAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'لطفاً مبلغ حمایت را به تومان وارد کنید.';
  }
  if (amount < effectiveMin) {
    return `حداقل مبلغ حمایت ${formatToman(effectiveMin)} است.`;
  }
  if (amount > MAX_SUPPORT_TOMAN) {
    return `حداکثر مبلغ هر حمایت ${formatToman(MAX_SUPPORT_TOMAN)} است.`;
  }
  return null;
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!trimmed) {
    return 'نام کاربری الزامی است.';
  }
  if (trimmed.length < 3 || trimmed.length > 24) {
    return 'نام کاربری باید بین ۳ تا ۲۴ کاراکتر باشد.';
  }
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return 'نام کاربری فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط زیر (_) باشد.';
  }
  return null;
}

export interface SupportValidationInput {
  amount: number;
  minAmount?: number;
  name: string;
  isAnonymous: boolean;
  message: string;
}

export function validateSupportForm(input: SupportValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const amountErr = validateSupportAmount(input.amount, input.minAmount ?? MIN_SUPPORT_TOMAN);
  if (amountErr) {
    errors['amount'] = amountErr;
  }

  if (!input.isAnonymous && input.name.trim().length < 2) {
    errors['name'] = 'نام خود را وارد کنید یا گزینه حمایت ناشناس را انتخاب کنید.';
  }

  if (input.message.trim().length > 280) {
    errors['message'] = 'پیام حمایتی نباید بیشتر از ۲۸۰ کاراکتر باشد.';
  }

  return errors;
}

export function validateSheba(sheba: string): string | null {
  const raw = String(sheba ?? '').replace(/\s+/g, '').toUpperCase();
  if (!raw) {
    return 'شماره شبا الزامی است.';
  }
  const normalized = /^\d{24}$/.test(raw) ? `IR${raw}` : raw;
  if (!/^IR\d{24}$/.test(normalized)) {
    return 'شماره شبا باید با پیشوند IR و ۲۴ رقم عدد (مجموعاً ۲۶ کاراکتر) تشکیل شده باشد.';
  }
  return null;
}
