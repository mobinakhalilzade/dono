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
  templateUrl: './login.html',
  styleUrl: './login.scss',
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
    email: new FormControl<string>('', { nonNullable: true }),
    password: new FormControl<string>('', { nonNullable: true }),
  });

  protected readonly signUpSubmitted = signal(false);
  protected readonly signUpErrors = signal<Record<string, string>>({});
  protected readonly signUpForm = new FormGroup({
    firstName: new FormControl<string>('', { nonNullable: true }),
    lastName: new FormControl<string>('', { nonNullable: true }),
    email: new FormControl<string>('', { nonNullable: true }),
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

    console.log(val)
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
