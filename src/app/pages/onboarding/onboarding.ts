import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppIcon } from '../../components/icon/icon';
import { AVATAR_ALI_URL, AVATAR_NEGAR_URL, AVATAR_SARA_URL } from '../../data/mock-data';
import { CATEGORY_LABELS, CreatorCategory } from '../../models/dono.models';
import { AuthService } from '../../services/auth.service';
import { CreatorService } from '../../services/creator.service';
import { validateUsername } from '../../utils/formatters';

@Component({
  selector: 'app-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppIcon],
  template: `
    <section class="onboarding-section">
      <div class="container onboarding-container">
        <div class="surface-card onboarding-card">
          <header class="onboarding-head">
            <h1 class="onboarding-title balance-text">تکمیل صفحه دونو شما</h1>
            <p class="onboarding-subtitle">
              مشخصات پایه صفحه خود را وارد کنید تا بلافاصله لینک اختصاصی شما ساخته شود.
            </p>
          </header>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="onboarding-form">
            <div class="field-group">
              <span class="field-label">انتخاب تصویر پروفایل</span>
              <div class="avatar-picker">
                @for (item of avatarOptions(); track item.url) {
                  <button
                    type="button"
                    class="avatar-choice"
                    [class.is-selected]="selectedAvatar() === item.url"
                    (click)="selectAvatar(item.url)"
                    [attr.aria-label]="item.label"
                  >
                    <img [src]="item.url" [alt]="item.label" referrerpolicy="no-referrer" />
                  </button>
                }
              </div>
            </div>

            <div class="field-group">
              <label for="onboard-username" class="field-label">نام کاربری (لینک صفحه)</label>
              <div class="username-wrap">
                <span class="username-prefix" dir="ltr">dono.com/&#64;</span>
                <input
                  id="onboard-username"
                  type="text"
                  dir="ltr"
                  formControlName="username"
                  class="field-input username-input"
                  [class.is-invalid]="submitted() && !!errors()['username']"
                  placeholder="sara_studio"
                />
              </div>
              @if (submitted() && errors()['username']; as err) {
                <span class="field-error">
                  <app-icon name="alert" [size]="14" />
                  <span>{{ err }}</span>
                </span>
              } @else {
                <span class="field-hint">فقط حروف انگلیسی کوچک، عدد و خط زیر (_) مجاز است.</span>
              }
            </div>

            <div class="field-group">
              <label for="onboard-name" class="field-label">نام نمایشی</label>
              <input
                id="onboard-name"
                type="text"
                formControlName="displayName"
                class="field-input"
                [class.is-invalid]="submitted() && !!errors()['displayName']"
                placeholder="مثلاً سارا محمدی"
              />
              @if (submitted() && errors()['displayName']; as err) {
                <span class="field-error">
                  <app-icon name="alert" [size]="14" />
                  <span>{{ err }}</span>
                </span>
              }
            </div>

            <div class="two-cols">
              <div class="field-group">
                <label for="onboard-category" class="field-label">حوزه فعالیت</label>
                <select id="onboard-category" formControlName="category" class="field-select">
                  @for (cat of categories; track cat.key) {
                    <option [value]="cat.key">{{ cat.label }}</option>
                  }
                </select>
              </div>

              <div class="field-group">
                <label for="onboard-price" class="field-label">حداقل مبلغ حمایت (تومان)</label>
                <input
                  id="onboard-price"
                  type="number"
                  min="10000"
                  max="50000000"
                  step="5000"
                  formControlName="minSupportAmount"
                  class="field-input tabular-nums"
                  [class.is-invalid]="submitted() && !!errors()['minSupportAmount']"
                />
                @if (submitted() && errors()['minSupportAmount']; as err) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ err }}</span>
                  </span>
                }
              </div>
            </div>

            <div class="field-group">
              <label for="onboard-bio" class="field-label">معرفی کوتاه و داستان شما</label>
              <textarea
                id="onboard-bio"
                formControlName="bio"
                class="field-textarea"
                [class.is-invalid]="submitted() && !!errors()['bio']"
                placeholder="برای مخاطبان بنویسید روی چه پروژه‌ای کار می‌کنید و حمایتشان چه کمکی می‌کند..."
              ></textarea>
              @if (submitted() && errors()['bio']; as err) {
                <span class="field-error">
                  <app-icon name="alert" [size]="14" />
                  <span>{{ err }}</span>
                </span>
              }
            </div>

            <button type="submit" class="btn btn-primary submit-btn" [disabled]="saving()">
              <app-icon name="check" [size]="18" />
              <span>{{ saving() ? 'در حال ساخت صفحه...' : 'ساخت صفحه و ورود به داشبورد' }}</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: `
    .onboarding-section {
      padding-block: 3rem 2rem;
    }

    .onboarding-container {
      display: flex;
      justify-content: center;
    }

    .onboarding-card {
      width: 100%;
      max-inline-size: 620px;
      padding: 2rem 1.5rem;
      border-block-start: 3px solid var(--accent);
      animation: dastFadeSlideUp 340ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @media (min-width: 768px) {
      .onboarding-card {
        padding: 2.5rem;
      }
    }

    .onboarding-head {
      margin-block-end: 1.75rem;
    }

    .onboarding-title {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
    }

    .onboarding-subtitle {
      margin: 0.45rem 0 0;
      color: var(--text-secondary);
    }

    .onboarding-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .avatar-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .avatar-choice {
      inline-size: 64px;
      block-size: 64px;
      padding: 0;
      border-radius: 16px;
      border: 2px solid var(--border-subtle);
      overflow: hidden;
      cursor: pointer;
      background-color: var(--bg-subtle);
      transition: border-color var(--transition-fast), transform var(--transition-fast);
    }

    .avatar-choice img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-choice.is-selected {
      border-color: var(--secondary-accent);
      transform: scale(1.04);
    }

    .username-wrap {
      display: flex;
      align-items: stretch;
      direction: ltr;
    }

    .username-prefix {
      display: inline-flex;
      align-items: center;
      padding-inline: 0.75rem;
      background-color: var(--secondary-accent-soft);
      border: 1px solid var(--border-strong);
      border-inline-end: 0;
      border-start-start-radius: var(--radius-md);
      border-end-start-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--secondary-accent-ink);
      white-space: nowrap;
    }

    .username-input {
      border-start-start-radius: 0;
      border-end-start-radius: 0;
      text-align: left;
    }

    .two-cols {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 640px) {
      .two-cols {
        grid-template-columns: 1fr 1fr;
      }
    }

    .submit-btn {
      margin-block-start: 0.5rem;
      width: 100%;
    }
  `,
})
export class OnboardingComponent {
  private readonly authService = inject(AuthService);
  private readonly creatorService = inject(CreatorService);
  private readonly router = inject(Router);

  private readonly baseAvatars = [
    { url: AVATAR_SARA_URL, label: 'تصویر آواتار ۱' },
    { url: AVATAR_ALI_URL, label: 'تصویر آواتار ۲' },
    { url: AVATAR_NEGAR_URL, label: 'تصویر آواتار ۳' },
  ];

  protected readonly avatarOptions = computed(() => {
    const googleAvatar = this.authService.currentUser()?.avatarUrl;
    if (
      googleAvatar &&
      !this.baseAvatars.some((item) => item.url === googleAvatar)
    ) {
      return [{ url: googleAvatar, label: 'تصویر پروفایل گوگل' }, ...this.baseAvatars];
    }
    return this.baseAvatars;
  });

  protected readonly categories: Array<{ key: CreatorCategory; label: string }> = (
    Object.keys(CATEGORY_LABELS) as CreatorCategory[]
  ).map((key) => ({ key, label: CATEGORY_LABELS[key] }));

  protected readonly selectedAvatar = signal(
    this.authService.currentUser()?.avatarUrl || AVATAR_SARA_URL,
  );
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly errors = signal<Record<string, string>>({});

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true }),
    displayName: new FormControl(
      this.authService.currentUser()?.displayName &&
        this.authService.currentUser()?.displayName !== 'کاربر جدید'
        ? this.authService.currentUser()!.displayName
        : '',
      { nonNullable: true },
    ),
    category: new FormControl<CreatorCategory>('illustration', { nonNullable: true }),
    minSupportAmount: new FormControl<number>(50000, { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
  });

  protected selectAvatar(url: string): void {
    this.selectedAvatar.set(url);
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    const val = this.form.getRawValue();
    const errs: Record<string, string> = {};

    const usernameError = validateUsername(val.username);
    if (usernameError) {
      errs['username'] = usernameError;
    } else if (
      this.creatorService
        .creators()
        .some((c) => c.username.toLowerCase() === val.username.trim().toLowerCase())
    ) {
      errs['username'] = 'این نام کاربری قبلاً ثبت شده است. نام دیگری انتخاب کنید.';
    }

    if (val.displayName.trim().length < 3) {
      errs['displayName'] = 'نام نمایشی باید حداقل ۳ کاراکتر باشد.';
    }

    if (!Number.isFinite(val.minSupportAmount) || val.minSupportAmount < 10000) {
      errs['minSupportAmount'] = 'حداقل مبلغ حمایت باید دست‌کم ۱۰٬۰۰۰ تومان باشد.';
    } else if (val.minSupportAmount > 50000000) {
      errs['minSupportAmount'] = 'حداکثر مبلغ مجاز ۵۰٬۰۰۰٬۰۰۰ تومان است.';
    }

    if (val.bio.trim().length < 12) {
      errs['bio'] = 'معرفی کوتاه باید حداقل ۱۲ کاراکتر باشد.';
    }

    this.errors.set(errs);
    if (Object.keys(errs).length > 0) {
      return;
    }

    this.saving.set(true);
    await this.authService.completeOnboarding({
      username: val.username,
      displayName: val.displayName,
      category: val.category,
      minSupportAmount: Number(val.minSupportAmount),
      bio: val.bio,
      avatarUrl: this.selectedAvatar(),
    });
    this.saving.set(false);
    await this.router.navigateByUrl('/dashboard');
  }
}
