import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AVATAR_SARA_URL, COVER_CREATIVE_URL } from '../data/mock-data';
import { AuthUser, CreatorCategory } from '../models/dono.models';
import { GoogleSessionUserPayload, isAllowedPopupOrigin } from '../utils/auth-utils';
import { normalizeDigits } from '../utils/auth-validators';
import { CreatorService } from './creator.service';

// TODO: move this to your environment file
const DIRECTUS_URL = 'http://localhost:8055';
const DIRECTUS_ME_PATH = '/users/me?fields=id,email,first_name,last_name';

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AUTH_STORAGE_KEY = 'dono_auth_user';
const GOOGLE_CREATOR_MAP_KEY = 'dono_google_creator_map';
const ACTIVATION_MAP_KEY = 'dono_activation_map_v1';

interface DirectusMe {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
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
  email: string;
  password: string;
  /** Optional creator page handle. If empty, one is generated from the email. */
  username?: string;
}

export interface CredentialsLoginInput {
  email: string;
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

/** Converts a Directus error code to a Persian message */
function directusErrorMessage(code?: string): string {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'ایمیل یا رمز عبور نادرست است.';
    case 'RECORD_NOT_UNIQUE':
      return 'این ایمیل قبلاً ثبت شده است.';
    case 'INVALID_PAYLOAD':
      return 'اطلاعات واردشده معتبر نیست.';
    case 'FORBIDDEN':
      return 'ثبت‌نام یا ورود در حال حاضر مجاز نیست.';
    case 'USER_SUSPENDED':
      return 'حساب کاربری شما مسدود شده است.';
    case 'REQUESTS_EXCEEDED':
      return 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.';
    default:
      return 'خطایی رخ داد. دوباره تلاش کنید.';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly creatorService = inject(CreatorService);
  private sessionInitialized = false;

  readonly currentUser = signal<AuthUser | null>(this.loadStoredUser());

  // ---------------------------------------------------------------------------
  // Local storage helpers
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Directus helpers
  // ---------------------------------------------------------------------------

  private cleanUsername(raw: string): string {
    return normalizeDigits(raw).replace(/^@/, '').trim().toLowerCase();
  }

  private cleanEmail(raw: string): string {
    return normalizeDigits(raw).trim().toLowerCase();
  }

  /** Suggests a creator page handle from an email and makes sure it is not taken */
  private uniqueUsername(email: string): string {
    let base = email.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 24);
    if (base.length < 3) base = `user${base}`;

    const taken = (name: string) =>
      this.creatorService.creators().some((c) => c.username.toLowerCase() === name);

    let candidate = base;
    while (taken(candidate)) {
      candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return candidate;
  }

  /** Small wrapper around fetch for Directus: session cookie + error handling */
  private async directusRequest<T = null>(
    path: string,
    method: 'GET' | 'POST',
    body?: unknown,
  ): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${DIRECTUS_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
    } catch {
      throw new Error('ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.');
    }

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(directusErrorMessage(json?.errors?.[0]?.extensions?.code));
    }

    if (res.status === 204) return null as T;
    const json = await res.json().catch(() => null);
    return (json?.data ?? null) as T;
  }

  /** Builds the app user from a Directus user, and makes sure a creator page exists */
  private buildCredentialsUser(me: DirectusMe, preferredUsername?: string): AuthUser {
    const firstName = me.first_name ?? '';
    const lastName = me.last_name ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    const activation = this.loadActivationMap()[me.id];
    const emailLower = me.email.toLowerCase();

    const findCreator = () =>
      this.creatorService
        .creators()
        .find((c) => c.ownerEmail && c.ownerEmail.toLowerCase() === emailLower);

    let matchedCreator = findCreator();

    if (!matchedCreator) {
      const username = preferredUsername ?? this.uniqueUsername(me.email);
      this.creatorService.upsertCreator({
        id: `cr-${Date.now()}`,
        username,
        displayName: fullName || username,
        tagline: 'آفریننده مستقل در دونو',
        bio: '',
        category: 'illustration',
        avatarUrl: AVATAR_SARA_URL,
        coverUrl: COVER_CREATIVE_URL,
        minSupportAmount: 50000,
        supportersCount: 0,
        totalRaised: 0,
        verified: false,
        activated: activation?.activated ?? false,
        socialLinks: [],
        createdAt: new Date().toISOString(),
        ownerEmail: me.email,
      });
      matchedCreator = findCreator();
    }

    return {
      id: me.id,
      email: me.email,
      displayName: matchedCreator?.displayName || fullName || me.email,
      firstName,
      lastName,
      username: matchedCreator?.username ?? null,
      avatarUrl: matchedCreator?.avatarUrl || AVATAR_SARA_URL,
      onboarded: Boolean(matchedCreator),
      activated: activation?.activated ?? matchedCreator?.activated ?? false,
      birthDateJalali: activation?.birthDateJalali,
      nationalCode: activation?.nationalCode,
      sheba: activation?.sheba,
      provider: 'credentials',
    };
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

  // ---------------------------------------------------------------------------
  // Session
  // ---------------------------------------------------------------------------

  async initSession(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.sessionInitialized) {
      return;
    }
    this.sessionInitialized = true;

    // 1) Restore the Directus session (email/password users)
    try {
      const res = await fetch(`${DIRECTUS_URL}${DIRECTUS_ME_PATH}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: DirectusMe | null };
        if (json?.data) {
          this.persistUser(this.buildCredentialsUser(json.data));
          return;
        }
      } else if (this.currentUser()?.provider === 'credentials') {
        // Session expired or invalid: log the stored credentials user out
        this.persistUser(null);
      }
    } catch {
      // Directus unreachable: keep the locally stored state
    }

    // 2) Restore the Google session (existing flow)
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

  // ---------------------------------------------------------------------------
  // Email/password (username) auth with Directus
  // ---------------------------------------------------------------------------

  async signUpWithCredentials(input: CredentialsSignUpInput): Promise<AuthUser> {
    const email = this.cleanEmail(input.email);
    if (!EMAIL_PATTERN.test(email)) {
      throw new Error('ایمیل واردشده معتبر نیست.');
    }

    // The creator page handle is optional; if empty it is generated from the email
    let username: string | undefined;
    if (input.username?.trim()) {
      username = this.cleanUsername(input.username);
      if (!USERNAME_PATTERN.test(username)) {
        throw new Error(
          'نام کاربری باید ۳ تا ۳۰ کاراکتر باشد و فقط شامل حروف انگلیسی، عدد یا _ باشد.',
        );
      }
      const handle = username;
      const handleTaken = this.creatorService
        .creators()
        .some((c) => c.username.toLowerCase() === handle);
      if (handleTaken) {
        throw new Error('این نام کاربری قبلاً ثبت شده است. لطفاً نام کاربری دیگری انتخاب کنید.');
      }
    }

    // Directus answers 204 on success, and RECORD_NOT_UNIQUE if the email exists
    await this.directusRequest('/users/register', 'POST', {
      email,
      password: input.password,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
    });

    // Log the new user in right away
    return this.loginWithEmail(email, input.password, username);
  }

  async signInWithCredentials(input: CredentialsLoginInput): Promise<AuthUser> {
    return this.loginWithEmail(this.cleanEmail(input.email), input.password);
  }

  private async loginWithEmail(
    email: string,
    password: string,
    preferredUsername?: string,
  ): Promise<AuthUser> {
    // mode "session" makes Directus set the session cookie
    await this.directusRequest('/auth/login', 'POST', {
      email,
      password,
      mode: 'session',
    });

    const me = await this.directusRequest<DirectusMe>(DIRECTUS_ME_PATH, 'GET');
    if (!me) {
      throw new Error('خطایی رخ داد. دوباره تلاش کنید.');
    }

    const authUser = this.buildCredentialsUser(me, preferredUsername);
    this.persistUser(authUser);
    return authUser;
  }

  // ---------------------------------------------------------------------------
  // Profile / activation
  // ---------------------------------------------------------------------------

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

    // TODO: store these in Directus (custom fields on directus_users) instead of localStorage
    this.saveActivationRecord(current.id, {
      activated: true,
      birthDateJalali: input.birthDateJalali,
      nationalCode: input.nationalCode,
      sheba: input.sheba,
    });

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
  }

  // ---------------------------------------------------------------------------
  // Google sign-in (unchanged)
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Onboarding / sign out
  // ---------------------------------------------------------------------------

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
    if (!isPlatformBrowser(this.platformId)) return;

    // Close the Directus session
    void this.directusRequest('/auth/logout', 'POST', { mode: 'session' }).catch(() => {
      // Ignore errors on signOut
    });

    // Close the Google session (existing flow)
    void fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {
      // Ignore network errors on signOut
    });
  }
}
