import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatJalaliBirthdateLabel,
  getJalaliMonthDays,
  hashPasswordClient,
  isJalaliLeapYear,
  maskNationalCode,
  normalizeAndValidateSocialLinks,
  normalizeDigits,
  validateActivationInput,
  validateFarsiName,
  validateJalaliBirthdate,
  validateNationalCode,
  validateSignUpInput,
} from './auth-validators';
import { validateSheba } from './formatters';

test('validateFarsiName enforces Persian characters and min length', () => {
  assert.equal(validateFarsiName('علی'), true);
  assert.equal(validateFarsiName('سارا'), true);
  assert.equal(validateFarsiName('John'), false);
  assert.equal(validateFarsiName('ع'), false);
});

test('validateJalaliBirthdate enforces age above 18 (max birth year 1387)', () => {
  const underage = validateJalaliBirthdate({ year: 1390, month: 1, day: 1 });
  assert.ok(underage.error);

  const adult = validateJalaliBirthdate({ year: 1375, month: 1, day: 1 });
  assert.equal(adult.error, null);
});

test('validateSheba ensures IR prefix and 24 digits', () => {
  assert.equal(validateSheba('IR820540102680020817909002'), null);
  assert.equal(validateSheba('820540102680020817909002'), null);
  assert.ok(validateSheba('IR123'));
});

test('normalizeDigits converts Persian and Arabic digits to Latin', () => {
  assert.equal(normalizeDigits('۱۳۷۵/۰۴/۱۵'), '1375/04/15');
  assert.equal(normalizeDigits('٠٠١٣٥٢٠٨٤٩'), '0013520849');
});

test('validateNationalCode verifies Iranian 10-digit checksum and rejects invalid/repeated digits', () => {
  assert.equal(validateNationalCode('0013520849'), null);
  assert.equal(validateNationalCode('۰۰۱۳۵۲۰۸۴۹'), null);
  assert.ok(validateNationalCode('0013520840'));
  assert.ok(validateNationalCode('1111111111'));
  assert.ok(validateNationalCode('12345'));
});

test('validateJalaliBirthdate validates months and Esfand leap days', () => {
  assert.equal(isJalaliLeapYear(1375), true);
  assert.equal(isJalaliLeapYear(1376), false);
  assert.equal(getJalaliMonthDays(1375, 12), 30);
  assert.equal(getJalaliMonthDays(1376, 12), 29);

  const ok = validateJalaliBirthdate({ year: '۱۳۷۵', month: 12, day: 30 });
  assert.equal(ok.error, null);
  assert.equal(ok.formatted, '1375/12/30');
  assert.equal(formatJalaliBirthdateLabel(ok.formatted ?? undefined), '۳۰ اسفند ۱۳۷۵');

  const badEsfand = validateJalaliBirthdate({ year: 1376, month: 12, day: 30 });
  assert.ok(badEsfand.error);
});

test('validateSignUpInput requires firstName, lastName, email, phoneNumber, password, and confirmPassword', () => {
  const emptyErrs = validateSignUpInput({
    firstName: '',
    lastName: 'ر',
    email: 'Ab',
    phoneNumber: '123',
    password: '123',
    confirmPassword: '456',
  });
  assert.ok(emptyErrs['firstName']);
  assert.ok(emptyErrs['lastName']);
  assert.ok(emptyErrs['username']);
  assert.ok(emptyErrs['phoneNumber']);
  assert.ok(emptyErrs['password']);
  assert.ok(emptyErrs['confirmPassword']);

  const okErrs = validateSignUpInput({
    firstName: 'آرمان',
    lastName: 'کریمی',
    email: 'arman_art',
    phoneNumber: '09123456789',
    password: 'secret123',
    confirmPassword: 'secret123',
  });
  assert.deepEqual(okErrs, {});
});

test('validateActivationInput validates Jalali birthdate, national code, and Sheba together', () => {
  const invalid = validateActivationInput({
    birthYear: 1410,
    birthMonth: 4,
    birthDay: 15,
    nationalCode: '0013520841',
    sheba: 'IR123',
  });
  assert.ok(invalid.errors['birthDate']);
  assert.ok(invalid.errors['nationalCode']);
  assert.ok(invalid.errors['sheba']);

  const valid = validateActivationInput({
    birthYear: '۱۳۷۴',
    birthMonth: 6,
    birthDay: 12,
    nationalCode: '۰۰۱۳۵۲۰۸۴۹',
    sheba: 'ir820540102680020817909002',
  });
  assert.deepEqual(valid.errors, {});
  assert.equal(valid.birthDateJalali, '1374/06/12');
  assert.equal(valid.normalizedNationalCode, '0013520849');
  assert.equal(valid.normalizedSheba, 'IR820540102680020817909002');
  assert.equal(maskNationalCode(valid.normalizedNationalCode), '۰۰۱••••۸۴۹');
});

test('normalizeAndValidateSocialLinks normalizes URLs and catches malformed domains', () => {
  const res = normalizeAndValidateSocialLinks([
    { platform: 'instagram', label: 'اینستاگرام', url: 'instagram.com/sara_art' },
    { platform: 'telegram', label: 'تلگرام', url: 'https://t.me/sara_art' },
    { platform: 'website', label: 'وب‌سایت شخصی', url: 'not-a-domain' },
  ]);
  assert.equal(res.links.length, 2);
  assert.equal(res.links[0].url, 'https://instagram.com/sara_art');
  assert.ok(res.errors['website']);
});

test('hashPasswordClient is deterministic per password and salt', () => {
  const h1 = hashPasswordClient('my-pass-1', 'user1');
  const h2 = hashPasswordClient('my-pass-1', 'user1');
  const h3 = hashPasswordClient('my-pass-2', 'user1');
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
});
