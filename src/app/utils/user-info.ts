export interface UserInfoApiPayload {
  nationalId: string;
  sheba: string;
  birthdate: string;
}

export function buildUserInfoPayload(input: {
  nationalCode: string;
  sheba: string;
  birthDateJalali: string;
}): UserInfoApiPayload {
  return {
    nationalId: input.nationalCode.trim(),
    sheba: input.sheba.trim().toUpperCase(),
    birthdate: input.birthDateJalali.trim(),
  };
}

export function extractUserInfoApiError(status: number, body: unknown): string {
  if (body && typeof body === 'object') {
    const obj = body as {
      message?: unknown;
      error?: unknown;
      errors?: Array<{ message?: unknown; extensions?: { code?: unknown } }>;
    };

    const code = obj.errors?.[0]?.extensions?.code;
    if (typeof code === 'string') {
      switch (code) {
        case 'RECORD_NOT_UNIQUE':
          return 'این کد ملی یا شماره شبا قبلاً ثبت شده است.';
        case 'INVALID_PAYLOAD':
          return 'اطلاعات هویتی یا بانکی واردشده معتبر نیست.';
        case 'FORBIDDEN':
        case 'TOKEN_EXPIRED':
        case 'INVALID_CREDENTIALS':
          return 'نشست کاربری شما معتبر نیست. لطفاً دوباره وارد حساب خود شوید.';
        default:
          break;
      }
    }

    const firstMsg = obj.errors?.[0]?.message ?? obj.message ?? obj.error;
    if (typeof firstMsg === 'string' && firstMsg.trim()) {
      return firstMsg.trim();
    }
  }

  if (status === 401 || status === 403) {
    return 'برای ثبت اطلاعات هویتی باید ابتدا وارد حساب خود شوید.';
  }
  if (status === 409) {
    return 'این اطلاعات قبلاً در سامانه ثبت شده است.';
  }
  if (status === 400 || status === 422) {
    return 'اطلاعات واردشده توسط سرور تایید نشد. لطفاً مقادیر را بررسی کنید.';
  }
  return 'خطایی در ثبت اطلاعات رخ داد. لطفاً دوباره تلاش کنید.';
}
