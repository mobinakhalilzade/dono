import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AVATAR_SARA_URL, COVER_CREATIVE_URL } from '../data/mock-data';
import { AuthUser, CreatorCategory } from '../models/dono.models';
import { GoogleSessionUserPayload, isAllowedPopupOrigin } from '../utils/auth-utils';
import { hashPasswordClient, normalizeDigits } from '../utils/auth-validators';
import { CreatorService } from './creator.service';

const AUTH_STORAGE_KEY = 'dono_auth_user';
const GOOGLE_CREATOR_MAP_KEY = 'dono_google_creator_map';
const LOCAL_ACCOUNTS_KEY = 'dono_local_accounts_v1';
const ACTIVATION_MAP_KEY = 'dono_activation_map_v1';

interface LocalAccountRecord {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  activated: boolean;
  birthDateJalali?: string;
  nationalCode?: string;
  sheba?: string;
  createdAt: string;
}

interface ActivationRecord {
  activated: boolean;
  birthDateJalali: string;
  nationalCode: string;
  sheba: string;
}

export interface OnboardingInput {
  username: string;
  displayName: string;
  bio: string;
  category: CreatorCategory;
  minSupportAmount: number;
  avatarUrl: string;
}

export interface CredentialsSignUpInput {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
}

export interface CredentialsLoginInput {
  username: string;
  password: string;
}

export interface UserActivationInput {
  birthDateJalali: string;
  nationalCode: string;
  sheba: string;
}

export class GoogleOAuthError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'OAUTH_NOT_CONFIGURED'
      | 'POPUP_BLOCKED'
      | 'POPUP_CLOSED'
      | 'AUTH_FAILED'
      | 'NETWORK_ERROR',
    readonly callbackUrl?: string,
  ) {
    super(message);
    this.name = 'GoogleOAuthError';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly creatorService = inject(CreatorService);
  private sessionInitialized = false;

  readonly currentUser = signal<AuthUser | null>(this.loadStoredUser());

  private loadStoredUser(): AuthUser | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private persistUser(user: AuthUser | null): void {
    this.currentUser.set(user);
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }

  private loadCreatorMap(): Record<string, string> {
    if (!isPlatformBrowser(this.platformId)) return {};
    try {
      const raw = localStorage.getItem(GOOGLE_CREATOR_MAP_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, string>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private saveCreatorMapping(userId: string, username: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const map = this.loadCreatorMap();
      map[userId] = username;
      localStorage.setItem(GOOGLE_CREATOR_MAP_KEY, JSON.stringify(map));
    } catch {
      // Ignore storage errors
    }
  }

  private loadLocalAccounts(): LocalAccountRecord[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LocalAccountRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveLocalAccounts(list: LocalAccountRecord[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage errors
    }
  }

  private loadActivationMap(): Record<string, ActivationRecord> {
    if (!isPlatformBrowser(this.platformId)) return {};
    try {
      const raw = localStorage.getItem(ACTIVATION_MAP_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, ActivationRecord>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private saveActivationRecord(userId: string, record: ActivationRecord): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const map = this.loadActivationMap();
      map[userId] = record;
      localStorage.setItem(ACTIVATION_MAP_KEY, JSON.stringify(map));
    } catch {
      // Ignore storage errors
    }
  }

  private hydrateAuthUserFromGoogle(googleUser: GoogleSessionUserPayload): AuthUser {
    const creators = this.creatorService.creators();
    const mappedUsername = this.loadCreatorMap()[googleUser.id];
    const matchedCreator = creators.find(
      (c) =>
        (mappedUsername && c.username.toLowerCase() === mappedUsername.toLowerCase()) ||
        (c.ownerEmail && c.ownerEmail.toLowerCase() === googleUser.email.toLowerCase()),
    );
    const activation = this.loadActivationMap()[googleUser.id];

    return {
      id: googleUser.id,
      email: googleUser.email,
      displayName: matchedCreator?.displayName || googleUser.displayName,
      username: matchedCreator?.username ?? null,
      avatarUrl: matchedCreator?.avatarUrl || googleUser.avatarUrl || AVATAR_SARA_URL,
      onboarded: Boolean(matchedCreator),
      activated: Boolean(activation?.activated ?? (matchedCreator?.activated === true)),
      birthDateJalali: activation?.birthDateJalali,
      nationalCode: activation?.nationalCode,
      sheba: activation?.sheba,
      provider: 'google',
    };
  }

  async initSession(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.sessionInitialized) {
      return;
    }
    this.sessionInitialized = true;

    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as { user: GoogleSessionUserPayload | null };
      if (data.user) {
        const hydrated = this.hydrateAuthUserFromGoogle(data.user);
        this.persistUser(hydrated);
      }
    } catch {
      // Keep local stored state if offline/unreachable
    }
  }

  async signInAsDemoCreator(): Promise<AuthUser> {
    const existing: AuthUser = {
      id: 'usr-sara',
      email: 'sara@dono.ir',
      displayName: 'سارا محمدی',
      firstName: 'سارا',
      lastName: 'محمدی',
      username: 'sara_art',
      avatarUrl: AVATAR_SARA_URL,
      onboarded: true,
      activated: true,
      birthDateJalali: '1374/06/12',
      nationalCode: '0013520849',
      sheba: 'IR820540102680020817909002',
      provider: 'demo',
    };
    this.persistUser(existing);
    return existing;
  }

  async signUpWithCredentials(input: CredentialsSignUpInput): Promise<AuthUser> {
    try {
      await fetch('/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        credentials: 'include',
      });
    } catch {
      // Ignore network errors in offline/preview mode
    }

    const cleanFirst = input.firstName.trim();
    const cleanLast = input.lastName.trim();
    const cleanUsername = normalizeDigits(input.username).replace(/^@/, '').trim().toLowerCase();
    const displayName = `${cleanFirst} ${cleanLast}`.trim();

    const accounts = this.loadLocalAccounts();
    const creatorExists = this.creatorService
      .creators()
      .some((c) => c.username.toLowerCase() === cleanUsername);
    const accountExists = accounts.some(
      (a) => a.username.toLowerCase() === cleanUsername,
    );

    if (creatorExists || accountExists) {
      throw new Error('این نام کاربری قبلاً ثبت شده است. لطفاً نام کاربری دیگری انتخاب کنید.');
    }

    const userId = `usr-cred-${Date.now()}`;
    const syntheticEmail = `${cleanUsername}@dono.ir`;
    const passwordHash = hashPasswordClient(input.password, cleanUsername);
    const nowIso = new Date().toISOString();

    const newAccount: LocalAccountRecord = {
      id: userId,
      firstName: cleanFirst,
      lastName: cleanLast,
      username: cleanUsername,
      email: syntheticEmail,
      passwordHash,
      avatarUrl: AVATAR_SARA_URL,
      activated: false,
      createdAt: nowIso,
    };

    this.saveLocalAccounts([newAccount, ...accounts]);

    this.creatorService.upsertCreator({
      id: `cr-${Date.now()}`,
      username: cleanUsername,
      displayName,
      tagline: 'آفریننده مستقل در دونو',
      bio: '',
      category: 'illustration',
      avatarUrl: AVATAR_SARA_URL,
      coverUrl: COVER_CREATIVE_URL,
      minSupportAmount: 50000,
      supportersCount: 0,
      totalRaised: 0,
      verified: false,
      activated: false,
      socialLinks: [],
      createdAt: nowIso,
      ownerEmail: syntheticEmail,
    });

    const authUser: AuthUser = {
      id: userId,
      email: syntheticEmail,
      displayName,
      firstName: cleanFirst,
      lastName: cleanLast,
      username: cleanUsername,
      avatarUrl: AVATAR_SARA_URL,
      onboarded: true,
      activated: false,
      provider: 'credentials',
    };

    this.persistUser(authUser);
    return authUser;
  }

  async signInWithCredentials(input: CredentialsLoginInput): Promise<AuthUser> {
    try {
      await fetch('/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        credentials: 'include',
      });
    } catch {
      // Ignore network errors in offline/preview mode
    }

    const cleanUsername = normalizeDigits(input.username).replace(/^@/, '').trim().toLowerCase();
    const accounts = this.loadLocalAccounts();
    const account = accounts.find((a) => a.username.toLowerCase() === cleanUsername);

    if (!account) {
      throw new Error('حسابی با این نام کاربری یافت نشد.');
    }

    const incomingHash = hashPasswordClient(input.password, cleanUsername);
    if (account.passwordHash !== incomingHash) {
      throw new Error('رمز عبور واردشده نادرست است.');
    }

    let matchedCreator = this.creatorService
      .creators()
      .find((c) => c.username.toLowerCase() === cleanUsername);

    if (!matchedCreator) {
      this.creatorService.upsertCreator({
        id: `cr-${Date.now()}`,
        username: cleanUsername,
        displayName: `${account.firstName} ${account.lastName}`.trim(),
        tagline: 'آفریننده مستقل در دونو',
        bio: '',
        category: 'illustration',
        avatarUrl: account.avatarUrl || AVATAR_SARA_URL,
        coverUrl: COVER_CREATIVE_URL,
        minSupportAmount: 50000,
        supportersCount: 0,
        totalRaised: 0,
        verified: false,
        activated: account.activated,
        socialLinks: [],
        createdAt: account.createdAt,
        ownerEmail: account.email,
      });
      matchedCreator = this.creatorService
        .creators()
        .find((c) => c.username.toLowerCase() === cleanUsername);
    }

    const authUser: AuthUser = {
      id: account.id,
      email: account.email,
      displayName: matchedCreator?.displayName || `${account.firstName} ${account.lastName}`.trim(),
      firstName: account.firstName,
      lastName: account.lastName,
      username: cleanUsername,
      avatarUrl: matchedCreator?.avatarUrl || account.avatarUrl || AVATAR_SARA_URL,
      onboarded: true,
      activated: account.activated,
      birthDateJalali: account.birthDateJalali,
      nationalCode: account.nationalCode,
      sheba: account.sheba,
      provider: 'credentials',
    };

    this.persistUser(authUser);
    return authUser;
  }

  activateCurrentUser(input: UserActivationInput): AuthUser | null {
    const current = this.currentUser();
    if (!current) return null;

    const updated: AuthUser = {
      ...current,
      activated: true,
      birthDateJalali: input.birthDateJalali,
      nationalCode: input.nationalCode,
      sheba: input.sheba,
    };

    this.saveActivationRecord(current.id, {
      activated: true,
      birthDateJalali: input.birthDateJalali,
      nationalCode: input.nationalCode,
      sheba: input.sheba,
    });

    if (current.provider === 'credentials' && current.username) {
      const accounts = this.loadLocalAccounts();
      const nextAccounts = accounts.map((acc) =>
        acc.username.toLowerCase() === current.username!.toLowerCase()
          ? {
              ...acc,
              activated: true,
              birthDateJalali: input.birthDateJalali,
              nationalCode: input.nationalCode,
              sheba: input.sheba,
            }
          : acc,
      );
      this.saveLocalAccounts(nextAccounts);
    }

    if (current.username) {
      this.creatorService.updateCreatorProfile(current.username, {
        activated: true,
      });
    }

    this.persistUser(updated);
    return updated;
  }

  syncCurrentUserProfile(patch: { displayName?: string; avatarUrl?: string }): void {
    const current = this.currentUser();
    if (!current) return;
    const updated: AuthUser = {
      ...current,
      displayName: patch.displayName ?? current.displayName,
      avatarUrl: patch.avatarUrl ?? current.avatarUrl,
    };
    this.persistUser(updated);

    if (current.provider === 'credentials' && current.username) {
      const accounts = this.loadLocalAccounts();
      const nextAccounts = accounts.map((acc) =>
        acc.username.toLowerCase() === current.username!.toLowerCase()
          ? { ...acc, avatarUrl: updated.avatarUrl }
          : acc,
      );
      this.saveLocalAccounts(nextAccounts);
    }
  }

  async signInWithGoogle(asExistingCreator = false): Promise<AuthUser> {
    if (asExistingCreator) {
      return this.signInAsDemoCreator();
    }

    if (!isPlatformBrowser(this.platformId)) {
      throw new GoogleOAuthError('ورود با گوگل فقط در مرورگر امکان‌پذیر است.', 'AUTH_FAILED');
    }

    let url = '';
    try {
      const response = await fetch('/api/auth/google/url', { credentials: 'include' });
      const data = (await response.json()) as {
        configured?: boolean;
        url?: string;
        error?: string;
        message?: string;
        callbackUrl?: string;
      };

      if (!response.ok || data.configured === false || !data.url) {
        throw new GoogleOAuthError(
          data.message || 'خطا در آماده‌سازی ورود با گوگل.',
          data.error === 'OAUTH_NOT_CONFIGURED' ? 'OAUTH_NOT_CONFIGURED' : 'AUTH_FAILED',
          data.callbackUrl,
        );
      }
      url = data.url;
    } catch (err) {
      if (err instanceof GoogleOAuthError) {
        throw err;
      }
      throw new GoogleOAuthError(
        'برقراری ارتباط با سرور برای ورود با گوگل ناموفق بود.',
        'NETWORK_ERROR',
      );
    }

    const popup = window.open(
      url,
      'dono_google_oauth',
      'width=520,height=660,scrollbars=yes,resizable=yes',
    );

    if (!popup) {
      throw new GoogleOAuthError(
        'پنجره ورود گوگل توسط مرورگر مسدود شد. لطفاً باز شدن پنجره (Popup) را برای این سایت مجاز کنید.',
        'POPUP_BLOCKED',
      );
    }

    return new Promise<AuthUser>((resolve, reject) => {
      let settled = false;
      let closeCheckGraceTimer: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        window.removeEventListener('message', handleMessage);
        clearInterval(closePoller);
        if (closeCheckGraceTimer) {
          clearTimeout(closeCheckGraceTimer);
        }
      };

      const finishSuccess = (payload: GoogleSessionUserPayload) => {
        if (settled) return;
        settled = true;
        cleanup();
        const hydrated = this.hydrateAuthUserFromGoogle(payload);
        this.persistUser(hydrated);
        resolve(hydrated);
      };

      const finishError = (error: GoogleOAuthError) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      const handleMessage = (event: MessageEvent) => {
        if (!isAllowedPopupOrigin(event.origin, window.location.origin)) {
          return;
        }
        const msg = event.data as
          | { type?: string; user?: GoogleSessionUserPayload; message?: string }
          | undefined;
        if (!msg || typeof msg !== 'object') return;

        if (msg.type === 'GOOGLE_AUTH_SUCCESS' && msg.user) {
          finishSuccess(msg.user);
        } else if (msg.type === 'GOOGLE_AUTH_ERROR') {
          finishError(
            new GoogleOAuthError(
              msg.message || 'ورود با گوگل تکمیل نشد.',
              'AUTH_FAILED',
            ),
          );
        }
      };

      window.addEventListener('message', handleMessage);

      const closePoller = setInterval(() => {
        if (popup.closed && !settled && !closeCheckGraceTimer) {
          closeCheckGraceTimer = setTimeout(() => {
            finishError(
              new GoogleOAuthError(
                'پنجره ورود با گوگل پیش از تکمیل بسته شد.',
                'POPUP_CLOSED',
              ),
            );
          }, 600);
        }
      }, 450);
    });
  }

  async completeOnboarding(input: OnboardingInput): Promise<AuthUser> {
    const cleanUsername = input.username.trim().toLowerCase();
    const current = this.currentUser() ?? {
      id: 'usr-google-1',
      email: 'creator@gmail.com',
      displayName: input.displayName.trim(),
      username: cleanUsername,
      avatarUrl: input.avatarUrl,
      onboarded: true,
      activated: false,
      provider: 'google' as const,
    };

    const updated: AuthUser = {
      ...current,
      displayName: input.displayName.trim(),
      username: cleanUsername,
      avatarUrl: input.avatarUrl || AVATAR_SARA_URL,
      onboarded: true,
      activated: current.activated ?? false,
    };

    this.creatorService.upsertCreator({
      id: `cr-${Date.now()}`,
      username: cleanUsername,
      displayName: updated.displayName,
      tagline: input.bio.trim().slice(0, 72),
      bio: input.bio.trim(),
      category: input.category,
      avatarUrl: updated.avatarUrl,
      coverUrl: COVER_CREATIVE_URL,
      minSupportAmount: input.minSupportAmount,
      supportersCount: 0,
      totalRaised: 0,
      verified: false,
      activated: updated.activated ?? false,
      socialLinks: [],
      createdAt: new Date().toISOString(),
      ownerEmail: updated.email,
    });

    this.saveCreatorMapping(updated.id, cleanUsername);
    this.persistUser(updated);
    return updated;
  }

  signOut(): void {
    this.persistUser(null);
    if (isPlatformBrowser(this.platformId)) {
      void fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignore network errors on signOut
      });
    }
  }
}
