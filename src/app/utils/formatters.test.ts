import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatJalaliDate,
  formatToman,
  getCreatorDisplayUrl,
  getCreatorShareUrl,
  MAX_SUPPORT_TOMAN,
  MIN_SUPPORT_TOMAN,
  toPersianDigits,
  validateSheba,
  validateSupportAmount,
  validateSupportForm,
  validateUsername,
} from './formatters';

test('toPersianDigits converts Latin digits to Persian digits', () => {
  assert.equal(toPersianDigits('1405-08-25'), '۱۴۰۵-۰۸-۲۵');
  assert.equal(toPersianDigits(50000), '۵۰۰۰۰');
});

test('formatToman formats amounts with Persian digits and Toman suffix', () => {
  const formatted = formatToman(150000);
  assert.ok(formatted.endsWith(' تومان'));
  assert.ok(formatted.includes('۱۵۰'));
  assert.ok(formatted.includes('۰۰۰'));
});

test('formatJalaliDate converts ISO date into Jalali calendar in Persian', () => {
  const jalali = formatJalaliDate('2026-11-15T12:00:00Z');
  assert.ok(jalali.includes('۱۴۰۵'));
  assert.ok(jalali.includes('آبان'));
});

test('getCreatorShareUrl builds canonical dono.com/@username links', () => {
  assert.equal(getCreatorDisplayUrl('@Sara_Art'), 'dono.com/@sara_art');
  assert.equal(getCreatorShareUrl('ali_code'), 'https://dono.com/@ali_code');
});

test('validateSupportAmount enforces min and max Toman bounds', () => {
  assert.ok(validateSupportAmount(MIN_SUPPORT_TOMAN - 1) !== null);
  assert.ok(validateSupportAmount(MAX_SUPPORT_TOMAN + 1) !== null);
  assert.equal(validateSupportAmount(100000), null);
});

test('validateUsername enforces lowercase alphanumeric and underscore', () => {
  assert.equal(validateUsername('sara_art'), null);
  assert.ok(validateUsername('ab') !== null);
  assert.ok(validateUsername('Sara-Art') !== null);
});

test('validateSupportForm validates amount and non-anonymous name', () => {
  const invalid = validateSupportForm({
    amount: 5000,
    name: '',
    isAnonymous: false,
    message: '',
  });
  assert.ok(invalid['amount']);
  assert.ok(invalid['name']);

  const validAnonymous = validateSupportForm({
    amount: 100000,
    name: '',
    isAnonymous: true,
    message: 'موفق باشید!',
  });
  assert.deepEqual(validAnonymous, {});
});

test('validateSheba checks IR + 24 digits', () => {
  assert.equal(validateSheba('IR820540102680020817909002'), null);
  assert.ok(validateSheba('12345') !== null);
});
