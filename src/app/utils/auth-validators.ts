import { SocialLink } from '../models/dono.models';
import { toPersianDigits, validateSheba, validateUsername } from './formatters';

export interface JalaliMonthOption {
  value: number;
  label: string;
}

export const JALALI_MONTHS: readonly JalaliMonthOption[] = [
  { value: 1, label: 'فروردین' },
  { value: 2, label: 'اردیبهشت' },
  { value: 3, label: 'خرداد' },
  { value: 4, label: 'تیر' },
  { value: 5, label: 'مرداد' },
  { value: 6, label: 'شهریور' },
  { value: 7, label: 'مهر' },
  { value: 8, label: 'آبان' },
  { value: 9, label: 'آذر' },
  { value: 10, label: 'دی' },
  { value: 11, label: 'بهمن' },
  { value: 12, label: 'اسفند' },
];

export const SOCIAL_PLATFORM_META: ReadonlyArray<{
  platform: SocialLink['platform'];
  label: string;
  placeholder: string;
}> = [
  { platform: 'instagram', label: 'اینستاگرام', placeholder: 'https://instagram.com/username' },
  { platform: 'telegram', label: 'تلگرام', placeholder: 'https://t.me/channel' },
  { platform: 'youtube', label: 'یوتیوب', placeholder: 'https://youtube.com/@channel' },
  { platform: 'x', label: 'ایکس (X)', placeholder: 'https://x.com/username' },
  { platform: 'github', label: 'گیت‌هاب', placeholder: 'https://github.com/username' },
  { platform: 'website', label: 'وب‌سایت شخصی', placeholder: 'https://example.com' },
];

export function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 0x0660));
}

export function isJalaliLeapYear(year: number): boolean {
  if (!Number.isInteger(year) || year < 1200 || year > 1500) {
    return false;
  }
  const mod = year % 33;
  return mod === 1 || mod === 5 || mod === 9 || mod === 13 || mod === 17 || mod === 22 || mod === 26 || mod === 30;
}

export function getJalaliMonthDays(year: number, month: number): number {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  if (month === 12) return isJalaliLeapYear(year) ? 30 : 29;
  return 0;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 6) {
    return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
  }
  if (password.length > 72) {
    return 'رمز عبور نباید بیشتر از ۷۲ کاراکتر باشد.';
  }
  return null;
}

export function validatePhoneNumber(phone: string): string | null {
  const clean = normalizeDigits(phone).replace(/[\s-]+/g, '');
  if (!clean) {
    return 'شماره موبایل الزامی است.';
  }
  if (!/^09\d{9}$/.test(clean)) {
    return 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.';
  }
  return null;
}

export interface SignUpValidationInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export function validateFarsiName(name: string): boolean {
  const trimmed = String(name ?? '').trim();
  if (trimmed.length < 2) return false;
  return /^[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\s]+$/.test(trimmed);
}

export function validateSignUpInput(input: SignUpValidationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.firstName || !validateFarsiName(input.firstName)) {
    errors['firstName'] = 'نام باید فقط شامل حروف فارسی و حداقل ۲ کاراکتر باشد.';
  }
  if (!input.lastName || !validateFarsiName(input.lastName)) {
    errors['lastName'] = 'نام خانوادگی باید فقط شامل حروف فارسی و حداقل ۲ کاراکتر باشد.';
  }
  // const cleanUser = normalizeDigits(input.email).trim().toLowerCase();
  // const userErr = validateUsername(cleanUser);
  // if (userErr) {
  //   errors['email'] = userErr;
  // }
  const phoneErr = validatePhoneNumber(input.phoneNumber);
  if (phoneErr) {
    errors['phoneNumber'] = phoneErr;
  }
  const passErr = validatePassword(input.password);
  if (passErr) {
    errors['password'] = passErr;
  }
  if (input.password !== input.confirmPassword) {
    errors['confirmPassword'] = 'تکرار رمز عبور با رمز عبور مطابقت ندارد.';
  }
  return errors;
}

export function validateLoginInput(input: {
  email: string;
  password: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!normalizeDigits(input.email).trim()) {
    errors['username'] = 'ایمیل را وارد کنید.';
  }
  if (!input.password) {
    errors['password'] = 'رمز عبور را وارد کنید.';
  }
  return errors;
}

export function validateNationalCode(rawCode: string): string | null {
  const clean = normalizeDigits(String(rawCode ?? '')).replace(/[\s-]+/g, '');
  if (!clean) {
    return 'کد ملی الزامی است.';
  }
  if (!/^\d{10}$/.test(clean)) {
    return 'کد ملی باید دقیقاً ۱۰ رقم و فقط شامل اعداد باشد (بدون حروف).';
  }
  if (/^(\d)\1{9}$/.test(clean)) {
    return 'کد ملی واردشده معتبر نیست.';
  }
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(clean[i]) * (10 - i);
  }
  const remainder = sum % 11;
  const checkDigit = Number(clean[9]);
  const expected = remainder < 2 ? remainder : 11 - remainder;
  if (checkDigit !== expected) {
    return 'کد ملی واردشده نامعتبر است.';
  }
  return null;
}

export function validateJalaliBirthdate(input: {
  year: number | string;
  month: number | string;
  day: number | string;
}): { error: string | null; formatted: string | null } {
  const year = Number(normalizeDigits(String(input.year ?? '')).trim());
  const month = Number(normalizeDigits(String(input.month ?? '')).trim());
  const day = Number(normalizeDigits(String(input.day ?? '')).trim());

  const currentJalaliYear = 1405;
  const maxBirthYear = currentJalaliYear - 18; // 1387 (age >= 18)

  if (!Number.isInteger(year) || year < 1300 || year > maxBirthYear) {
    return {
      error: `سال تولد شمسی باید بین ۱۳۰۰ تا ${toPersianDigits(maxBirthYear)} باشد (سن قانونی حداقل ۱۸ سال).`,
      formatted: null,
    };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return {
      error: 'ماه تولد را انتخاب کنید.',
      formatted: null,
    };
  }
  const maxDay = getJalaliMonthDays(year, month);
  if (!Number.isInteger(day) || day < 1 || day > maxDay) {
    return {
      error: `روز تولد برای این ماه باید بین ۱ تا ${toPersianDigits(maxDay)} باشد.`,
      formatted: null,
    };
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return {
    error: null,
    formatted: `${year}/${mm}/${dd}`,
  };
}

export interface ActivationValidationInput {
  birthYear: number | string;
  birthMonth: number | string;
  birthDay: number | string;
  nationalCode: string;
  sheba: string;
}

export function validateActivationInput(input: ActivationValidationInput): {
  errors: Record<string, string>;
  birthDateJalali: string | null;
  normalizedNationalCode: string;
  normalizedSheba: string;
} {
  const errors: Record<string, string> = {};
  const birthRes = validateJalaliBirthdate({
    year: input.birthYear,
    month: input.birthMonth,
    day: input.birthDay,
  });
  if (birthRes.error) {
    errors['birthDate'] = birthRes.error;
  }

  const normalizedNationalCode = normalizeDigits(input.nationalCode).replace(/[\s-]+/g, '');
  const ncErr = validateNationalCode(normalizedNationalCode);
  if (ncErr) {
    errors['nationalCode'] = ncErr;
  }

  const normalizedSheba = normalizeDigits(input.sheba).replace(/\s+/g, '').toUpperCase();
  const shebaErr = validateSheba(normalizedSheba);
  if (shebaErr) {
    errors['sheba'] = shebaErr;
  }

  return {
    errors,
    birthDateJalali: birthRes.formatted,
    normalizedNationalCode,
    normalizedSheba,
  };
}

export function formatJalaliBirthdateLabel(formatted: string | undefined): string {
  if (!formatted) return '—';
  const parts = formatted.split('/');
  if (parts.length !== 3) return toPersianDigits(formatted);
  const year = Number(parts[0]);
  const monthIdx = Number(parts[1]);
  const day = Number(parts[2]);
  const monthName = JALALI_MONTHS.find((m) => m.value === monthIdx)?.label;
  if (!monthName || !Number.isFinite(year) || !Number.isFinite(day)) {
    return toPersianDigits(formatted);
  }
  return `${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
}

export function maskNationalCode(code: string | undefined): string {
  if (!code || code.length !== 10) return '••••••••••';
  return `${toPersianDigits(code.slice(0, 3))}••••${toPersianDigits(code.slice(7))}`;
}

export function maskSheba(sheba: string | undefined): string {
  if (!sheba || sheba.length < 10) return 'IR•• ••••';
  return `${sheba.slice(0, 4)} •••• •••• •••• ${sheba.slice(-4)}`;
}

export function normalizeAndValidateSocialLinks(
  entries: Array<{ platform: SocialLink['platform']; label: string; url: string }>,
): { links: SocialLink[]; errors: Record<string, string> } {
  const links: SocialLink[] = [];
  const errors: Record<string, string> = {};

  for (const entry of entries) {
    const raw = entry.url.trim();
    if (!raw) continue;
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(candidate);
      if (!parsed.hostname.includes('.')) {
        errors[entry.platform] = `آدرس ${entry.label} معتبر نیست.`;
        continue;
      }
      links.push({
        platform: entry.platform,
        label: entry.label,
        url: parsed.toString(),
      });
    } catch {
      errors[entry.platform] = `آدرس ${entry.label} معتبر نیست.`;
    }
  }

  return { links, errors };
}

export function hashPasswordClient(password: string, salt = 'dono-v1'): string {
  const input = `${salt}:${password}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + ((i + 1) * 31);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}
