import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUserInfoPayload, extractUserInfoApiError } from './user-info';

test('buildUserInfoPayload formats nationalId, sheba, and birthdate cleanly', () => {
  const payload = buildUserInfoPayload({
    nationalCode: ' 0013520849 ',
    sheba: 'ir820540102680020817909002',
    birthDateJalali: ' 1375/04/15 ',
  });

  assert.deepEqual(payload, {
    nationalId: '0013520849',
    sheba: 'IR820540102680020817909002',
    birthdate: '1375/04/15',
  });
});

test('extractUserInfoApiError handles Directus error codes and custom messages', () => {
  assert.equal(
    extractUserInfoApiError(400, {
      errors: [{ extensions: { code: 'RECORD_NOT_UNIQUE' } }],
    }),
    'این کد ملی یا شماره شبا قبلاً ثبت شده است.',
  );

  assert.equal(
    extractUserInfoApiError(422, { message: 'کد ملی با تاریخ تولد تطابق ندارد.' }),
    'کد ملی با تاریخ تولد تطابق ندارد.',
  );

  assert.equal(
    extractUserInfoApiError(401, null),
    'برای ثبت اطلاعات هویتی باید ابتدا وارد حساب خود شوید.',
  );

  assert.equal(
    extractUserInfoApiError(500, null),
    'خطایی در ثبت اطلاعات رخ داد. لطفاً دوباره تلاش کنید.',
  );
});
