export function isAllowedPopupOrigin(origin: string, currentOrigin?: string): boolean {
  if (!origin) return false;
  if (currentOrigin && origin === currentOrigin) {
    return true;
  }
  try {
    const parsed = new URL(origin);
    return (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.endsWith('.run.app')
    );
  } catch {
    return false;
  }
}

export interface GoogleSessionUserPayload {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  provider: 'google';
}
