import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppIcon } from '../../components/icon/icon';
import { AuthService, GoogleOAuthError } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon],
  template: `
    <section class="auth-section">
      <div class="container auth-container">
        <div class="surface-card auth-card">
          <div class="auth-mark" aria-hidden="true">
            <app-icon name="brand" [size]="26" />
          </div>

          <h1 class="auth-title balance-text">ورود یا ساخت صفحه در دونو</h1>
          <p class="auth-subtitle">
            تنها با حساب گوگل وارد شوید و در کمتر از دو دقیقه صفحه حمایت شخصی خود را آماده کنید.
          </p>

          @if (authService.currentUser(); as current) {
            <div class="signed-in-box">
              <img
                [src]="current.avatarUrl"
                [alt]="current.displayName"
                referrerpolicy="no-referrer"
                class="signed-avatar"
              />
              <div class="signed-meta">
                <strong>{{ current.displayName }}</strong>
                <span dir="ltr">{{ current.email }}</span>
              </div>
              <a
                [routerLink]="current.onboarded ? '/dashboard' : '/onboarding'"
                class="btn btn-primary btn-sm"
              >
                {{ current.onboarded ? 'ورود به داشبورد' : 'تکمیل پروفایل' }}
              </a>
            </div>
          }

          <button
            type="button"
            class="btn google-btn"
            [disabled]="loading()"
            (click)="continueWithGoogle()"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99-3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>{{ loading() ? 'در حال اتصال به گوگل...' : 'ورود با گوگل' }}</span>
          </button>

          @if (errorMessage(); as err) {
            <div class="auth-alert" role="alert">
              <div class="auth-alert-head">
                <app-icon name="alert" [size]="18" />
                <span>{{ err }}</span>
              </div>
              @if (callbackUrlHint(); as cbUrl) {
                <p class="auth-alert-hint">
                  مسیر Redirect URI برای ثبت در کنسول گوگل:
                  <code dir="ltr" class="callback-code">{{ cbUrl }}</code>
                </p>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm demo-fallback-btn"
                  (click)="enterDemoPreview()"
                >
                  ورود آزمایشی با حساب نمونه (پیش‌نمایش)
                </button>
              }
            </div>
          }

          <p class="auth-terms">
            با ورود به دونو،
            <a routerLink="/terms">قوانین و مقررات</a>
            و
            <a routerLink="/privacy">حریم خصوصی</a>
            را می‌پذیرید.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .auth-section {
      padding-block: 4rem 3rem;
    }

    .auth-container {
      display: flex;
      justify-content: center;
    }

    .auth-card {
      width: 100%;
      max-inline-size: 460px;
      padding: 2.25rem 1.75rem;
      border-block-start: 3px solid var(--accent);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.1rem;
      animation: dastModalPop 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .auth-mark {
      inline-size: 56px;
      block-size: 56px;
      border-radius: 16px;
      background-color: var(--accent);
      color: var(--accent-text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .auth-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
    }

    .auth-subtitle {
      margin: 0;
      font-size: 0.95rem;
      color: var(--text-secondary);
    }

    .signed-in-box {
      width: 100%;
      padding: 0.75rem 0.9rem;
      border-radius: var(--radius-md);
      background-color: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-align: start;
    }

    .signed-avatar {
      inline-size: 40px;
      block-size: 40px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .signed-meta {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-inline-size: 0;
    }

    .signed-meta strong {
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .signed-meta span {
      font-size: 0.78rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .google-btn {
      width: 100%;
      min-block-size: 48px;
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      border: 1px solid var(--border-strong);
      font-size: 1rem;
      font-weight: 700;
      margin-block-start: 0.25rem;
    }

    .google-btn:hover:not(:disabled) {
      background-color: var(--bg-subtle);
    }

    .auth-alert {
      width: 100%;
      padding: 0.9rem 1rem;
      border-radius: var(--radius-md);
      background-color: var(--danger-bg);
      color: var(--danger-text);
      text-align: start;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      font-size: 0.875rem;
    }

    .auth-alert-head {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-weight: 600;
      line-height: 1.5;
    }

    .auth-alert-head app-icon {
      flex-shrink: 0;
      margin-block-start: 0.15rem;
    }

    .auth-alert-hint {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .callback-code {
      display: block;
      margin-block-start: 0.35rem;
      padding: 0.4rem 0.6rem;
      border-radius: var(--radius-sm);
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      font-size: 0.75rem;
      word-break: break-all;
    }

    .demo-fallback-btn {
      align-self: flex-start;
    }

    .auth-terms {
      margin: 0.25rem 0 0;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .auth-terms a {
      color: var(--secondary-accent-ink);
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  `,
})
export class LoginComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly callbackUrlHint = signal<string | null>(null);

  protected async continueWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.callbackUrlHint.set(null);

    try {
      const user = await this.authService.signInWithGoogle(false);
      await this.router.navigateByUrl(user.onboarded ? '/dashboard' : '/onboarding');
    } catch (error) {
      if (error instanceof GoogleOAuthError) {
        this.errorMessage.set(error.message);
        if (error.callbackUrl) {
          this.callbackUrlHint.set(error.callbackUrl);
        }
      } else {
        this.errorMessage.set('ورود با گوگل با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected async enterDemoPreview(): Promise<void> {
    await this.authService.signInAsDemoCreator();
    await this.router.navigateByUrl('/dashboard');
  }
}
