import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AVATAR_SARA_URL, COVER_CREATIVE_URL } from '../data/mock-data';
import { AuthUser, CreatorCategory } from '../models/dono.models';
import { GoogleSessionUserPayload, isAllowedPopupOrigin } from '../utils/auth-utils';
import { CreatorService } from './creator.service';

const AUTH_STORAGE_KEY = 'dono_auth_user';
const GOOGLE_CREATOR_MAP_KEY = 'dono_google_creator_map';

export interface OnboardingInput {
  username: string;
  displayName: string;
  bio: string;
  category: CreatorCategory;
  minSupportAmount: number;
  avatarUrl: string;
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

  private hydrateAuthUserFromGoogle(googleUser: GoogleSessionUserPayload): AuthUser {
    const creators = this.creatorService.creators();
    const mappedUsername = this.loadCreatorMap()[googleUser.id];
    const matchedCreator = creators.find(
      (c) =>
        (mappedUsername && c.username.toLowerCase() === mappedUsername.toLowerCase()) ||
        (c.ownerEmail && c.ownerEmail.toLowerCase() === googleUser.email.toLowerCase()),
    );

    return {
      id: googleUser.id,
      email: googleUser.email,
      displayName: matchedCreator?.displayName || googleUser.displayName,
      username: matchedCreator?.username ?? null,
      avatarUrl: matchedCreator?.avatarUrl || googleUser.avatarUrl || AVATAR_SARA_URL,
      onboarded: Boolean(matchedCreator),
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
      username: 'sara_art',
      avatarUrl: AVATAR_SARA_URL,
      onboarded: true,
      provider: 'demo',
    };
    this.persistUser(existing);
    return existing;
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
      provider: 'google' as const,
    };

    const updated: AuthUser = {
      ...current,
      displayName: input.displayName.trim(),
      username: cleanUsername,
      avatarUrl: input.avatarUrl || AVATAR_SARA_URL,
      onboarded: true,
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
