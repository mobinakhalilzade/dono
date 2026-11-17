import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppIcon, IconName } from '../../components/icon/icon';
import { ShareModalComponent } from '../../components/share-modal/share-modal';
import { ThankYouCelebrationComponent } from '../../components/thank-you-celebration/thank-you-celebration';
import {
  AVATAR_ALI_URL,
  AVATAR_NEGAR_URL,
  AVATAR_SARA_URL,
  COVER_CREATIVE_URL,
  COVER_PODCAST_URL,
  HERO_IMAGE_URL,
} from '../../data/mock-data';
import {
  CreatorCategory,
  PostKind,
  ThankYouAnimationId,
  ThankYouAnimationPack,
} from '../../models/dono.models';
import { ActivityCategoriesService } from '../../services/activity-categories.service';
import { AnimationStoreService } from '../../services/animation-store.service';
import { AuthService } from '../../services/auth.service';
import { CreatorService } from '../../services/creator.service';
import { SupportService } from '../../services/support.service';
import { ThemeService } from '../../services/theme.service';
import {
  JALALI_MONTHS,
  SOCIAL_PLATFORM_META,
  formatJalaliBirthdateLabel,
  maskNationalCode,
  maskSheba,
  normalizeAndValidateSocialLinks,
  validateActivationInput,
} from '../../utils/auth-validators';
import {
  MAX_SUPPORT_TOMAN,
  MIN_SUPPORT_TOMAN,
  formatJalaliDate,
  formatNumberFa,
  formatToman,
  validateSheba,
} from '../../utils/formatters';
import {
  QUICK_GOAL_TARGETS,
  getGoalProgressPercent,
  getGoalRemainingAmount,
  isGoalCompleted,
  validateCreatorPostInput,
} from '../../utils/post-goals';
import {
  THANK_YOU_ANIMATION_CATALOG,
  getAnimationPackById,
  hasOwnedAnimation,
} from '../../utils/thank-you-animations';

type DashboardTab =
  | 'overview'
  | 'activation'
  | 'posts'
  | 'animations'
  | 'supporters'
  | 'payouts'
  | 'editor'
  | 'settings';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppIcon,
    ShareModalComponent,
    ThankYouCelebrationComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);
  protected readonly creatorService = inject(CreatorService);
  protected readonly supportService = inject(SupportService);
  protected readonly animationStore = inject(AnimationStoreService);
  protected readonly themeService = inject(ThemeService);
  private readonly activityCategoriesService = inject(ActivityCategoriesService);
  private readonly router = inject(Router);

  protected readonly activeTab = signal<DashboardTab>('overview');
  protected readonly notifyEmail = signal(true);
  protected readonly shareModalOpen = signal(false);

  protected readonly animationCatalog = THANK_YOU_ANIMATION_CATALOG;
  protected readonly previewOpen = signal(false);
  protected readonly previewAnimId = signal<ThankYouAnimationId>('confetti-celebration');
  protected readonly animActionBanner = signal<string | null>(null);
  protected readonly purchaseModalPack = signal<ThankYouAnimationPack | null>(null);
  protected readonly purchaseMethod = signal<'balance' | 'direct'>('balance');
  protected readonly purchaseError = signal<string | null>(null);

  protected readonly thankYouNoteForm = new FormGroup({
    note: new FormControl<string>('', { nonNullable: true }),
  });
  protected readonly thankYouNoteSaved = signal(false);
  protected readonly thankYouNoteError = signal<string | null>(null);

  protected readonly activeCreator = computed(() => {
    const user = this.authService.currentUser();
    if (!user?.username) return null;
    return (
      this.creatorService
        .creators()
        .find((c) => c.username.toLowerCase() === user.username!.toLowerCase()) ?? null
    );
  });

  protected readonly supporters = computed(() => {
    const c = this.activeCreator();
    return c ? this.supportService.getSupportersByCreator(c.username) : [];
  });

  protected readonly payouts = computed(() => {
    const c = this.activeCreator();
    return c ? this.supportService.getPayoutsByCreator(c.username) : [];
  });

  protected readonly availableBalance = computed(() => {
    const c = this.activeCreator();
    return c ? this.supportService.getAvailableBalance(c.username) : 0;
  });

  protected readonly earnings = computed(() => {
    const c = this.activeCreator();
    return c ? this.supportService.getEarningsByCreator(c.username) : [];
  });

  protected readonly hasEarnings = computed(() =>
    this.earnings().some((m) => m.amount > 0),
  );

  protected readonly supporterSearch = new FormControl('', { nonNullable: true });
  private readonly supporterQuery = signal('');

  protected readonly filteredSupporters = computed(() => {
    const q = this.supporterQuery().trim().toLowerCase();
    const list = this.supporters();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.supporterName.toLowerCase().includes(q) || s.message.toLowerCase().includes(q),
    );
  });

  protected readonly categories = this.activityCategoriesService.categories;
  protected readonly categoriesLoading = this.activityCategoriesService.loading;
  protected readonly categoriesError = this.activityCategoriesService.error;

  protected readonly coverOptions = [
    { url: COVER_CREATIVE_URL, label: 'میز کار هنری' },
    { url: COVER_PODCAST_URL, label: 'استودیو پادکست' },
    { url: HERO_IMAGE_URL, label: 'فضای استودیو' },
  ];

  protected readonly avatarOptions = [
    { url: AVATAR_SARA_URL, label: 'پرتره هنری' },
    { url: AVATAR_ALI_URL, label: 'پرتره استودیو' },
    { url: AVATAR_NEGAR_URL, label: 'پرتره عکاسی' },
    { url: HERO_IMAGE_URL, label: 'آواتار کارگاه' },
  ];

  protected readonly jalaliMonths = JALALI_MONTHS;
  protected readonly socialPlatforms = SOCIAL_PLATFORM_META;
  protected readonly formatJalaliBirthdateLabel = formatJalaliBirthdateLabel;
  protected readonly maskNationalCode = maskNationalCode;
  protected readonly maskSheba = maskSheba;

  protected readonly isUserActivated = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (typeof user.activated === 'boolean') {
      return user.activated;
    }
    return this.activeCreator()?.activated !== false;
  });

  protected readonly hasCompletedPublicProfile = computed(() => {
    const c = this.activeCreator();
    if (!c) return false;
    return c.bio.trim().length >= 15 && c.socialLinks.length > 0;
  });

  // Activation form
  protected readonly activationForm = new FormGroup({
    birthDay: new FormControl<string>('', { nonNullable: true }),
    birthMonth: new FormControl<string>('', { nonNullable: true }),
    birthYear: new FormControl<string>('', { nonNullable: true }),
    nationalCode: new FormControl<string>('', { nonNullable: true }),
    sheba: new FormControl<string>('', { nonNullable: true }),
  });
  protected readonly activationSubmitted = signal(false);
  protected readonly activationLoading = signal(false);
  protected readonly activationApiError = signal<string | null>(null);
  protected readonly activationErrors = signal<Record<string, string>>({});

  // Payout form
  protected readonly payoutForm = new FormGroup({
    amount: new FormControl<number>(1000000, { nonNullable: true }),
    sheba: new FormControl<string>('', { nonNullable: true }),
  });
  protected readonly payoutSubmitted = signal(false);
  protected readonly payoutErrors = signal<Record<string, string>>({});
  protected readonly payoutSuccess = signal(false);

  // Page editor form
  protected readonly editorForm = new FormGroup({
    displayName: new FormControl<string>('', { nonNullable: true }),
    minSupportAmount: new FormControl<number>(50000, { nonNullable: true }),
    category: new FormControl<CreatorCategory>('illustration', { nonNullable: true }),
    avatarUrl: new FormControl<string>(AVATAR_SARA_URL, { nonNullable: true }),
    coverUrl: new FormControl<string>(COVER_CREATIVE_URL, { nonNullable: true }),
    tagline: new FormControl<string>('', { nonNullable: true }),
    bio: new FormControl<string>('', { nonNullable: true }),
  });
  protected readonly socialForm = new FormGroup({
    instagram: new FormControl<string>('', { nonNullable: true }),
    telegram: new FormControl<string>('', { nonNullable: true }),
    youtube: new FormControl<string>('', { nonNullable: true }),
    x: new FormControl<string>('', { nonNullable: true }),
    github: new FormControl<string>('', { nonNullable: true }),
    website: new FormControl<string>('', { nonNullable: true }),
  });
  protected readonly editorAvatarPreview = signal<string>(AVATAR_SARA_URL);
  protected readonly editorCoverPreview = signal<string>(COVER_CREATIVE_URL);
  protected readonly mediaUploadError = signal<string | null>(null);
  protected readonly editorSubmitted = signal(false);
  protected readonly editorErrors = signal<Record<string, string>>({});
  protected readonly editorSaved = signal(false);

  protected readonly creatorPosts = computed(() => {
    const c = this.activeCreator();
    if (!c) return [];
    const list = this.creatorService
      .posts()
      .filter((p) => p.creatorUsername.toLowerCase() === c.username.toLowerCase());
    const generals = list.filter((p) => p.kind === 'general');
    const goals = list
      .filter((p) => p.kind === 'goal')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return [...generals, ...goals];
  });

  protected readonly generalPostsCount = computed(
    () => this.creatorPosts().filter((p) => p.kind === 'general').length,
  );

  // Post publisher form
  protected readonly postForm = new FormGroup({
    kind: new FormControl<PostKind>('goal', { nonNullable: true }),
    targetAmount: new FormControl<number>(10_000_000, { nonNullable: true }),
    title: new FormControl<string>('', { nonNullable: true }),
    content: new FormControl<string>('', { nonNullable: true }),
  });
  protected readonly postKind = signal<PostKind>('goal');
  protected readonly postTargetAmount = signal<number>(10_000_000);
  protected readonly postSubmitted = signal(false);
  protected readonly postErrors = signal<Record<string, string>>({});
  protected readonly postPublished = signal(false);

  protected readonly quickGoalTargets = QUICK_GOAL_TARGETS;
  protected readonly getGoalProgressPercent = getGoalProgressPercent;
  protected readonly getGoalRemainingAmount = getGoalRemainingAmount;
  protected readonly isGoalCompleted = isGoalCompleted;
  protected readonly formatToman = formatToman;
  protected readonly formatNumberFa = formatNumberFa;
  protected readonly formatJalaliDate = formatJalaliDate;

  protected readonly creatorAnimConfig = computed(() => {
    const c = this.activeCreator();
    return c
      ? this.animationStore.getCreatorConfig(c.username)
      : {
          creatorUsername: '',
          ownedIds: ['standard' as const],
          activeId: 'standard' as const,
          thankYouNote: '',
        };
  });

  protected readonly activeAnimPack = computed(() =>
    getAnimationPackById(this.creatorAnimConfig().activeId),
  );

  private initialTabResolved = false;

  constructor() {
    void this.activityCategoriesService.loadCategories();
    this.activationForm.valueChanges.subscribe(() => {
      this.activationApiError.set(null);
      if (this.activationSubmitted()) {
        const val = this.activationForm.getRawValue();
        const res = validateActivationInput({
          birthYear: val.birthYear,
          birthMonth: val.birthMonth,
          birthDay: val.birthDay,
          nationalCode: val.nationalCode,
          sheba: val.sheba,
        });
        this.activationErrors.set(res.errors);
      }
    });
    this.supporterSearch.valueChanges.subscribe((v) => this.supporterQuery.set(v));
    this.postForm.controls.kind.valueChanges.subscribe((k) => this.postKind.set(k));
    this.postForm.controls.targetAmount.valueChanges.subscribe((v) =>
      this.postTargetAmount.set(Number(v) || 0),
    );
    this.editorForm.controls.avatarUrl.valueChanges.subscribe((v) => {
      if (v.trim()) this.editorAvatarPreview.set(v.trim());
    });
    this.editorForm.controls.coverUrl.valueChanges.subscribe((v) => {
      if (v.trim()) this.editorCoverPreview.set(v.trim());
    });

    effect(() => {
      const list = this.categories();
      if (list.length === 0) return;
      const current = untracked(() => this.editorForm.controls.category.value);
      if (!list.some((item) => item.key === current)) {
        this.editorForm.controls.category.setValue(list[0].key, { emitEvent: false });
      }
    });

    effect(() => {
      const c = this.activeCreator();
      const user = this.authService.currentUser();
      if (c && user) {
        if (!this.initialTabResolved) {
          this.initialTabResolved = true;
          if (!this.isUserActivated()) {
            untracked(() => this.activeTab.set('activation'));
          }
        }
        this.editorForm.patchValue(
          {
            displayName: c.displayName,
            minSupportAmount: c.minSupportAmount,
            category: c.category,
            avatarUrl: c.avatarUrl,
            coverUrl: c.coverUrl,
            tagline: c.tagline,
            bio: c.bio,
          },
          { emitEvent: false },
        );
        this.editorAvatarPreview.set(c.avatarUrl);
        this.editorCoverPreview.set(c.coverUrl);

        const linkMap: Record<string, string> = {};
        for (const sl of c.socialLinks) {
          linkMap[sl.platform] = sl.url;
        }
        this.socialForm.patchValue(
          {
            instagram: linkMap['instagram'] ?? '',
            telegram: linkMap['telegram'] ?? '',
            youtube: linkMap['youtube'] ?? '',
            x: linkMap['x'] ?? '',
            github: linkMap['github'] ?? '',
            website: linkMap['website'] ?? '',
          },
          { emitEvent: false },
        );

        if (user.sheba && !this.payoutForm.controls.sheba.value) {
          this.payoutForm.patchValue({ sheba: user.sheba }, { emitEvent: false });
        }

        const animCfg = this.animationStore.getCreatorConfig(c.username);
        this.thankYouNoteForm.patchValue({ note: animCfg.thankYouNote }, { emitEvent: false });
      }
    });
  }

  protected async enterDemoCreator(): Promise<void> {
    await this.authService.signInWithGoogle(true);
  }

  protected reloadCategories(): void {
    void this.activityCategoriesService.loadCategories(true);
  }

  protected barHeightPercent(amount: number): number {
    const max = Math.max(...this.earnings().map((e) => e.amount), 1);
    return Math.round((amount / max) * 100);
  }

  protected formatShortToman(amount: number): string {
    const millions = amount / 1_000_000;
    if (millions >= 1) {
      return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 }).format(millions)}م`;
    }
    return formatNumberFa(Math.round(amount / 1000)) + 'ه';
  }

  protected async submitActivation(): Promise<void> {
    this.activationSubmitted.set(true);
    this.activationApiError.set(null);
    const val = this.activationForm.getRawValue();
    const res = validateActivationInput({
      birthYear: val.birthYear,
      birthMonth: val.birthMonth,
      birthDay: val.birthDay,
      nationalCode: val.nationalCode,
      sheba: val.sheba,
    });
    this.activationErrors.set(res.errors);
    if (Object.keys(res.errors).length > 0 || !res.birthDateJalali) {
      return;
    }

    this.activationLoading.set(true);
    try {
      await this.authService.activateCurrentUser({
        birthDateJalali: res.birthDateJalali,
        nationalCode: res.normalizedNationalCode,
        sheba: res.normalizedSheba,
      });
      this.payoutForm.patchValue({ sheba: res.normalizedSheba });
      this.activationSubmitted.set(false);
    } catch (err) {
      this.activationApiError.set(
        err instanceof Error
          ? err.message
          : 'ثبت اطلاعات هویتی با خطا مواجه شد. لطفاً دوباره تلاش کنید.',
      );
    } finally {
      this.activationLoading.set(false);
    }
  }

  protected selectPresetMedia(field: 'avatarUrl' | 'coverUrl', url: string): void {
    this.mediaUploadError.set(null);
    this.editorForm.controls[field].setValue(url);
    if (field === 'avatarUrl') {
      this.editorAvatarPreview.set(url);
    } else {
      this.editorCoverPreview.set(url);
    }
  }

  protected onMediaFileSelected(event: Event, field: 'avatarUrl' | 'coverUrl'): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    this.mediaUploadError.set(null);

    if (!file.type.startsWith('image/')) {
      this.mediaUploadError.set('لطفاً فقط فایل تصویری معتبر انتخاب کنید.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.mediaUploadError.set('حجم تصویر نباید بیشتر از ۲ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.selectPresetMedia(field, reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  protected async submitPayout(): Promise<void> {
    const c = this.activeCreator();
    if (!c) return;
    if (!this.isUserActivated()) {
      this.payoutSubmitted.set(true);
      this.payoutErrors.set({
        sheba: 'ابتدا در بخش «فعال‌سازی حساب»، هویت و شماره شبا خود را تایید کنید.',
      });
      return;
    }
    this.payoutSubmitted.set(true);
    this.payoutSuccess.set(false);
    const val = this.payoutForm.getRawValue();
    const errs: Record<string, string> = {};

    if (!Number.isFinite(val.amount) || val.amount < 100000) {
      errs['amount'] = 'حداقل مبلغ تسویه ۱۰۰٬۰۰۰ تومان است.';
    } else if (val.amount > this.availableBalance()) {
      errs['amount'] = 'مبلغ درخواستی از موجودی قابل تسویه بیشتر است.';
    }

    const shebaErr = validateSheba(val.sheba);
    if (shebaErr) {
      errs['sheba'] = shebaErr;
    }

    this.payoutErrors.set(errs);
    if (Object.keys(errs).length > 0) return;

    await this.supportService.requestPayout(c.username, Number(val.amount), val.sheba);
    this.payoutSubmitted.set(false);
    this.payoutSuccess.set(true);
    this.payoutForm.patchValue({ sheba: this.authService.currentUser()?.sheba ?? '' });
  }

  protected saveProfile(): void {
    const c = this.activeCreator();
    if (!c) return;
    this.editorSubmitted.set(true);
    this.editorSaved.set(false);
    const val = this.editorForm.getRawValue();
    const socRaw = this.socialForm.getRawValue();
    const errs: Record<string, string> = {};

    if (val.displayName.trim().length < 3) {
      errs['displayName'] = 'نام نمایشی باید حداقل ۳ کاراکتر باشد.';
    }
    if (!Number.isFinite(val.minSupportAmount) || val.minSupportAmount < MIN_SUPPORT_TOMAN) {
      errs['minSupportAmount'] = `حداقل مبلغ حمایت ${formatToman(MIN_SUPPORT_TOMAN)} است.`;
    } else if (val.minSupportAmount > MAX_SUPPORT_TOMAN) {
      errs['minSupportAmount'] = `حداکثر مبلغ مجاز ${formatToman(MAX_SUPPORT_TOMAN)} است.`;
    }

    const socialRes = normalizeAndValidateSocialLinks(
      this.socialPlatforms.map((p) => ({
        platform: p.platform,
        label: p.label,
        url: socRaw[p.platform],
      })),
    );
    Object.assign(errs, socialRes.errors);

    this.editorErrors.set(errs);
    if (Object.keys(errs).length > 0) return;

    const nextAvatar = val.avatarUrl.trim() || c.avatarUrl;
    const nextCover = val.coverUrl.trim() || c.coverUrl;
    const nextName = val.displayName.trim();

    this.creatorService.updateCreatorProfile(c.username, {
      displayName: nextName,
      minSupportAmount: Number(val.minSupportAmount),
      category: val.category,
      avatarUrl: nextAvatar,
      coverUrl: nextCover,
      tagline: val.tagline.trim(),
      bio: val.bio.trim(),
      socialLinks: socialRes.links,
    });
    this.authService.syncCurrentUserProfile({
      displayName: nextName,
      avatarUrl: nextAvatar,
    });
    this.editorSaved.set(true);
  }

  protected setPostKind(kind: PostKind): void {
    this.postForm.controls.kind.setValue(kind);
    this.postErrors.set({});
    this.postPublished.set(false);
  }

  protected setQuickGoalTarget(amount: number): void {
    this.postForm.controls.targetAmount.setValue(amount);
  }

  protected removePost(postId: string): void {
    this.creatorService.deletePost(postId);
  }

  protected publishPost(): void {
    const c = this.activeCreator();
    if (!c) return;
    this.postSubmitted.set(true);
    this.postPublished.set(false);
    const val = this.postForm.getRawValue();
    const errs = validateCreatorPostInput({
      kind: val.kind,
      title: val.title,
      content: val.content,
      targetAmount: val.kind === 'goal' ? Number(val.targetAmount) : undefined,
    });

    this.postErrors.set(errs);
    if (Object.keys(errs).length > 0) return;

    this.creatorService.addPost({
      username: c.username,
      kind: val.kind,
      title: val.title,
      content: val.content,
      targetAmount: val.kind === 'goal' ? Number(val.targetAmount) : undefined,
    });
    this.postForm.reset({
      kind: val.kind,
      targetAmount: val.targetAmount || 10_000_000,
      title: '',
      content: '',
    });
    this.postSubmitted.set(false);
    this.postPublished.set(true);
  }

  protected isAnimOwned(id: ThankYouAnimationId): boolean {
    return hasOwnedAnimation(this.creatorAnimConfig().ownedIds, id);
  }

  protected animIconName(id: ThankYouAnimationId): IconName {
    switch (id) {
      case 'coral-hearts':
        return 'heart';
      case 'fireworks-gala':
        return 'flame';
      case 'golden-trophy':
        return 'trophy';
      case 'confetti-celebration':
        return 'sparkles';
      default:
        return 'check';
    }
  }

  protected openAnimationPreview(id: ThankYouAnimationId): void {
    this.previewAnimId.set(id);
    this.previewOpen.set(true);
  }

  protected openPurchaseModal(pack: ThankYouAnimationPack): void {
    this.purchaseError.set(null);
    this.animActionBanner.set(null);
    this.purchaseMethod.set(
      this.availableBalance() >= pack.priceToman ? 'balance' : 'direct',
    );
    this.purchaseModalPack.set(pack);
  }

  protected confirmAnimationPurchase(): void {
    const c = this.activeCreator();
    const pack = this.purchaseModalPack();
    if (!c || !pack) return;
    const res = this.animationStore.purchaseAnimation(
      c.username,
      pack.id,
      this.purchaseMethod(),
    );
    if (!res.ok) {
      this.purchaseError.set(res.error ?? 'خطا در خرید انیمیشن');
      return;
    }
    this.purchaseModalPack.set(null);
    this.animActionBanner.set(
      `انیمیشن «${pack.name}» با موفقیت خریداری و روی صفحه عمومی شما فعال شد!`,
    );
  }

  protected activateOwnedAnimation(id: ThankYouAnimationId): void {
    const c = this.activeCreator();
    if (!c) return;
    const res = this.animationStore.activateAnimation(c.username, id);
    if (res.ok) {
      const pack = getAnimationPackById(id);
      this.animActionBanner.set(`جلوه تشکر صفحه شما به «${pack.name}» تغییر یافت.`);
    }
  }

  protected saveThankYouNote(): void {
    const c = this.activeCreator();
    if (!c) return;
    this.thankYouNoteSaved.set(false);
    this.thankYouNoteError.set(null);
    const res = this.animationStore.updateThankYouNote(
      c.username,
      this.thankYouNoteForm.controls.note.value,
    );
    if (!res.ok) {
      this.thankYouNoteError.set(res.error ?? 'خطا در ذخیره پیام');
      return;
    }
    this.thankYouNoteSaved.set(true);
  }

  protected async logout(): Promise<void> {
    this.authService.signOut();
    await this.router.navigateByUrl('/');
  }
}
