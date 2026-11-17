import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppIcon } from '../../components/icon/icon';
import { AuthService, GoogleOAuthError } from '../../services/auth.service';
import { validateLoginInput, validateSignUpInput } from '../../utils/auth-validators';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AppIcon],
  template: `
    <section class="auth-section">
      <div class="container auth-container">
        <div class="surface-card auth-card">
          <div class="auth-mark" aria-hidden="true">
            <app-icon name="brand" [size]="26" />
          </div>

          <h1 class="auth-title balance-text">
            {{ mode() === 'signup' ? 'ساخت حساب در دونو' : 'ورود به حساب دونو' }}
          </h1>
          <p class="auth-subtitle">
            @if (mode() === 'signup') {
              مشخصات پایه خود را ثبت کنید تا وارد داشبورد شوید و حساب و پروفایل‌تان را فعال کنید.
            } @else {
              با نام کاربری و رمز عبور خود یا از طریق حساب گوگل وارد داشبورد شوید.
            }
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
                <span dir="ltr">{{ current.username ? '@' + current.username : current.email }}</span>
              </div>
              <a
                [routerLink]="current.onboarded ? '/dashboard' : '/onboarding'"
                class="btn btn-primary btn-sm"
              >
                {{ current.onboarded ? 'ورود به داشبورد' : 'تکمیل پروفایل' }}
              </a>
            </div>
          }

          <div class="auth-mode-tabs" role="tablist" aria-label="روش احراز هویت">
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="mode() === 'login'"
              class="auth-mode-tab"
              [class.is-active]="mode() === 'login'"
              (click)="switchMode('login')"
            >
              ورود
            </button>
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="mode() === 'signup'"
              class="auth-mode-tab"
              [class.is-active]="mode() === 'signup'"
              (click)="switchMode('signup')"
            >
              ثبت‌نام
            </button>
          </div>

          @if (mode() === 'signup') {
            <form [formGroup]="signUpForm" (ngSubmit)="submitSignUp()" novalidate class="auth-cred-form">
              <div class="auth-name-grid">
                <div class="field-group">
                  <label for="su-first" class="field-label">نام</label>
                  <input
                    id="su-first"
                    type="text"
                    formControlName="firstName"
                    autocomplete="given-name"
                    class="field-input"
                    [class.is-invalid]="signUpSubmitted() && !!signUpErrors()['firstName']"
                    placeholder="مثلاً مهسا"
                  />
                  @if (signUpSubmitted() && signUpErrors()['firstName']; as err) {
                    <span class="field-error">
                      <app-icon name="alert" [size]="14" />
                      <span>{{ err }}</span>
                    </span>
                  }
                </div>

                <div class="field-group">
                  <label for="su-last" class="field-label">نام خانوادگی</label>
                  <input
                    id="su-last"
                    type="text"
                    formControlName="lastName"
                    autocomplete="family-name"
                    class="field-input"
                    [class.is-invalid]="signUpSubmitted() && !!signUpErrors()['lastName']"
                    placeholder="مثلاً فرهادی"
                  />
                  @if (signUpSubmitted() && signUpErrors()['lastName']; as err) {
                    <span class="field-error">
                      <app-icon name="alert" [size]="14" />
                      <span>{{ err }}</span>
                    </span>
                  }
                </div>
              </div>

              <div class="field-group">
                <label for="su-username" class="field-label">نام کاربری (انگلیسی)</label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix-tag" dir="ltr">&#64;</span>
                  <input
                    id="su-username"
                    type="text"
                    dir="ltr"
                    formControlName="username"
                    autocomplete="username"
                    class="field-input input-with-prefix"
                    [class.is-invalid]="signUpSubmitted() && !!signUpErrors()['username']"
                    placeholder="mahsa_art"
                  />
                </div>
                @if (signUpSubmitted() && signUpErrors()['username']; as err) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ err }}</span>
                  </span>
                } @else {
                  <span class="field-hint">آدرس صفحه شما: dono.com/&#64;username</span>
                }
              </div>

              <div class="field-group">
                <label for="su-phone" class="field-label">شماره موبایل</label>
                <input
                  id="su-phone"
                  type="text"
                  inputmode="tel"
                  dir="ltr"
                  formControlName="phoneNumber"
                  autocomplete="tel"
                  class="field-input tabular-nums"
                  [class.is-invalid]="signUpSubmitted() && !!signUpErrors()['phoneNumber']"
                  placeholder="09123456789"
                />
                @if (signUpSubmitted() && signUpErrors()['phoneNumber']; as err) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ err }}</span>
                  </span>
                } @else {
                  <span class="field-hint">شماره ۱۱ رقمی شروع‌شونده با 09</span>
                }
              </div>

              <div class="field-group">
                <label for="su-password" class="field-label">رمز عبور</label>
                <div class="password-field-wrap">
                  <input
                    id="su-password"
                    [type]="showPassword() ? 'text' : 'password'"
                    dir="ltr"
                    formControlName="password"
                    autocomplete="new-password"
                    class="field-input password-input-pad"
                    [class.is-invalid]="signUpSubmitted() && !!signUpErrors()['password']"
                    placeholder="حداقل ۶ کاراکتر"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    [attr.aria-label]="showPassword() ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'"
                    (click)="showPassword.set(!showPassword())"
                  >
                    <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="17" />
                  </button>
                </div>
                @if (signUpSubmitted() && signUpErrors()['password']; as err) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ err }}</span>
                  </span>
                }
              </div>

              <div class="field-group">
                <label for="su-confirm" class="field-label">تکرار رمز عبور</label>
                <div class="password-field-wrap">
                  <input
                    id="su-confirm"
                    [type]="showPassword() ? 'text' : 'password'"
                    dir="ltr"
                    formControlName="confirmPassword"
                    autocomplete="new-password"
                    class="field-input password-input-pad"
                    [class.is-invalid]="signUpSubmitted() && !!signUpErrors()['confirmPassword']"
                    placeholder="تکرار رمز عبور"
                  />
                </div>
                @if (signUpSubmitted() && signUpErrors()['confirmPassword']; as err) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ err }}</span>
                  </span>
                }
              </div>

              <button type="submit" class="btn btn-primary full-btn" [disabled]="loading()">
                <app-icon name="check" [size]="18" />
                <span>ثبت‌نام و ورود به داشبورد</span>
              </button>
            </form>
          } @else {
            <form [formGroup]="loginForm" (ngSubmit)="submitLogin()" novalidate class="auth-cred-form">
              <div class="field-group">
                <label for="li-username" class="field-label">نام کاربری</label>
                <div class="input-prefix-wrap">
                  <span class="input-prefix-tag" dir="ltr">&#64;</span>
                  <input
                    id="li-username"
                    type="text"
                    dir="ltr"
                    formControlName="username"
                    autocomplete="username"
                    class="field-input input-with-prefix"
                    [class.is-invalid]="loginSubmitted() && !!loginErrors()['username']"
                    placeholder="username"
                  />
                </div>
                @if (loginSubmitted() && loginErrors()['username']; as err) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ err }}</span>
                  </span>
                }
              </div>

              <div class="field-group">
                <label for="li-password" class="field-label">رمز عبور</label>
                <div class="password-field-wrap">
                  <input
                    id="li-password"
                    [type]="showPassword() ? 'text' : 'password'"
                    dir="ltr"
                    formControlName="password"
                    autocomplete="current-password"
                    class="field-input password-input-pad"
                    [class.is-invalid]="loginSubmitted() && !!loginErrors()['password']"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    [attr.aria-label]="showPassword() ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'"
                    (click)="showPassword.set(!showPassword())"
                  >
                    <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="17" />
                  </button>
                </div>
                @if (loginSubmitted() && loginErrors()['password']; as err) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ err }}</span>
                  </span>
                }
              </div>

              <button type="submit" class="btn btn-primary full-btn" [disabled]="loading()">
                <app-icon name="arrow-left" [size]="18" />
                <span>ورود به داشبورد</span>
              </button>
            </form>
          }

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

          <div class="auth-divider">یا</div>

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

          <p class="auth-terms">
            با ورود یا ثبت‌نام در دونو،
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
      padding-block: 3.5rem 3rem;
    }

    .auth-container {
      display: flex;
      justify-content: center;
    }

    .auth-card {
      width: 100%;
      max-inline-size: 480px;
      padding: 2rem 1.75rem;
      border-block-start: 3px solid var(--accent);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
      animation: dastModalPop 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .auth-mark {
      inline-size: 54px;
      block-size: 54px;
      border-radius: 16px;
      background-color: var(--accent);
      color: var(--accent-text);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .auth-title {
      margin: 0;
      font-size: 1.45rem;
      font-weight: 800;
    }

    .auth-subtitle {
      margin: 0;
      font-size: 0.92rem;
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

    .full-btn {
      width: 100%;
      min-block-size: 46px;
      margin-block-start: 0.25rem;
    }

    .google-btn {
      width: 100%;
      min-block-size: 46px;
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      border: 1px solid var(--border-strong);
      font-size: 0.98rem;
      font-weight: 700;
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

  protected readonly mode = signal<AuthMode>('login');
  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly callbackUrlHint = signal<string | null>(null);

  protected readonly loginSubmitted = signal(false);
  protected readonly loginErrors = signal<Record<string, string>>({});
  protected readonly loginForm = new FormGroup({
    username: new FormControl<string>('', { nonNullable: true }),
    password: new FormControl<string>('', { nonNullable: true }),
  });

  protected readonly signUpSubmitted = signal(false);
  protected readonly signUpErrors = signal<Record<string, string>>({});
  protected readonly signUpForm = new FormGroup({
    firstName: new FormControl<string>('', { nonNullable: true }),
    lastName: new FormControl<string>('', { nonNullable: true }),
    username: new FormControl<string>('', { nonNullable: true }),
    phoneNumber: new FormControl<string>('', { nonNullable: true }),
    password: new FormControl<string>('', { nonNullable: true }),
    confirmPassword: new FormControl<string>('', { nonNullable: true }),
  });

  constructor() {
    this.signUpForm.valueChanges.subscribe(() => {
      if (this.signUpSubmitted()) {
        const val = this.signUpForm.getRawValue();
        const errs = validateSignUpInput(val);
        this.signUpErrors.set(errs);
      }
    });
    this.loginForm.valueChanges.subscribe(() => {
      if (this.loginSubmitted()) {
        const val = this.loginForm.getRawValue();
        const errs = validateLoginInput(val);
        this.loginErrors.set(errs);
      }
    });
  }

  protected switchMode(next: AuthMode): void {
    this.mode.set(next);
    this.errorMessage.set(null);
    this.callbackUrlHint.set(null);
    this.loginSubmitted.set(false);
    this.signUpSubmitted.set(false);
    this.loginErrors.set({});
    this.signUpErrors.set({});
  }

  protected async submitSignUp(): Promise<void> {
    this.signUpSubmitted.set(true);
    this.errorMessage.set(null);
    const val = this.signUpForm.getRawValue();
    const errs = validateSignUpInput(val);
    this.signUpErrors.set(errs);
    if (Object.keys(errs).length > 0) return;

    this.loading.set(true);
    try {
      await this.authService.signUpWithCredentials(val);
      await this.router.navigateByUrl('/dashboard');
    } catch (err) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'ثبت‌نام با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  protected async submitLogin(): Promise<void> {
    this.loginSubmitted.set(true);
    this.errorMessage.set(null);
    const val = this.loginForm.getRawValue();
    const errs = validateLoginInput(val);
    this.loginErrors.set(errs);
    if (Object.keys(errs).length > 0) return;

    this.loading.set(true);
    try {
      await this.authService.signInWithCredentials(val);
      await this.router.navigateByUrl('/dashboard');
    } catch (err) {
      this.errorMessage.set(
        err instanceof Error ? err.message : 'ورود با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
      );
    } finally {
      this.loading.set(false);
    }
  }

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
