import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppIcon } from '../../components/icon/icon';
import { AVATAR_ALI_URL, AVATAR_NEGAR_URL, AVATAR_SARA_URL } from '../../data/mock-data';
import { CreatorCategory } from '../../models/dono.models';
import { ActivityCategoriesService } from '../../services/activity-categories.service';
import { AuthService } from '../../services/auth.service';
import { CreatorService } from '../../services/creator.service';
import { validateUsername } from '../../utils/formatters';

@Component({
  selector: 'app-onboarding',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppIcon],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class OnboardingComponent {
  private readonly authService = inject(AuthService);
  private readonly creatorService = inject(CreatorService);
  private readonly activityCategoriesService = inject(ActivityCategoriesService);
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

  protected readonly categories = this.activityCategoriesService.categories;
  protected readonly categoriesLoading = this.activityCategoriesService.loading;
  protected readonly categoriesError = this.activityCategoriesService.error;

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

  constructor() {
    void this.activityCategoriesService.loadCategories();
    effect(() => {
      const list = this.categories();
      if (list.length === 0) return;
      const current = untracked(() => this.form.controls.category.value);
      if (!list.some((item) => item.key === current)) {
        this.form.controls.category.setValue(list[0].key, { emitEvent: false });
      }
    });
  }

  protected reloadCategories(): void {
    void this.activityCategoriesService.loadCategories(true);
  }

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
