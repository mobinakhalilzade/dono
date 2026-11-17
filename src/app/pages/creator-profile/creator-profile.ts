import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { AppIcon } from '../../components/icon/icon';
import { ShareModalComponent } from '../../components/share-modal/share-modal';
import { ThankYouCelebrationComponent } from '../../components/thank-you-celebration/thank-you-celebration';
import { CreatorPost } from '../../models/dono.models';
import { ActivityCategoriesService } from '../../services/activity-categories.service';
import { AnimationStoreService } from '../../services/animation-store.service';
import { CreatorService } from '../../services/creator.service';
import { SupportService } from '../../services/support.service';
import {
  MAX_SUPPORT_TOMAN,
  MIN_SUPPORT_TOMAN,
  QUICK_SUPPORT_AMOUNTS,
  formatJalaliDate,
  formatNumberFa,
  formatToman,
  validateSupportForm,
} from '../../utils/formatters';
import {
  getGoalProgressPercent,
  getGoalRemainingAmount,
  isGoalCompleted,
  validatePostDonationLimit,
} from '../../utils/post-goals';

@Component({
  selector: 'app-creator-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppIcon,
    ShareModalComponent,
    ThankYouCelebrationComponent,
  ],
  templateUrl: './creator-profile.html',
  styleUrl: './creator-profile.scss',
})
export class CreatorProfileComponent {
  private readonly creatorService = inject(CreatorService);
  private readonly supportService = inject(SupportService);
  private readonly animationStore = inject(AnimationStoreService);
  private readonly activityCategoriesService = inject(ActivityCategoriesService);

  readonly username = input.required<string>();

  protected readonly coverFailed = signal(false);
  protected readonly avatarFailed = signal(false);
  protected readonly shareModalOpen = signal(false);
  protected readonly activeTab = signal<'posts' | 'supporters'>('posts');

  protected readonly submitted = signal(false);
  protected readonly paymentModalOpen = signal(false);
  protected readonly processingPayment = signal(false);
  protected readonly paymentSuccessMessage = signal<string | null>(null);
  protected readonly celebrationOpen = signal(false);
  protected readonly lastCelebration = signal<{
    supporterName: string;
    amount: number;
    postTitle?: string;
  } | null>(null);

  protected readonly quickAmounts = QUICK_SUPPORT_AMOUNTS;
  protected readonly maxSupportAmount = MAX_SUPPORT_TOMAN;

  protected readonly supportForm = new FormGroup({
    targetPostId: new FormControl<string>('', { nonNullable: true }),
    amount: new FormControl<number>(100_000, { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true }),
    isAnonymous: new FormControl<boolean>(false, { nonNullable: true }),
    message: new FormControl<string>('', { nonNullable: true }),
  });

  private readonly amountSignal = toSignal(
    this.supportForm.controls.amount.valueChanges.pipe(
      startWith(this.supportForm.controls.amount.value),
    ),
    { initialValue: 100_000 },
  );

  private readonly targetPostIdSignal = toSignal(
    this.supportForm.controls.targetPostId.valueChanges.pipe(
      startWith(this.supportForm.controls.targetPostId.value),
    ),
    { initialValue: '' },
  );

  protected readonly creator = computed(() =>
    this.creatorService.creators().find(
      (c) => c.username.toLowerCase() === this.username().replace(/^@/, '').toLowerCase(),
    ),
  );

  protected readonly effectiveMinAmount = computed(() =>
    Math.max(MIN_SUPPORT_TOMAN, this.creator()?.minSupportAmount ?? MIN_SUPPORT_TOMAN),
  );

  protected readonly supporters = computed(() =>
    this.supportService.getSupportersByCreator(this.username()),
  );

  protected readonly orderedPosts = computed(() => {
    const clean = this.username().replace(/^@/, '').toLowerCase();
    const list = this.creatorService
      .posts()
      .filter((p) => p.creatorUsername.toLowerCase() === clean);
    return [...list].sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === 'general' ? -1 : 1;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  });

  protected readonly selectedPost = computed(() => {
    const posts = this.orderedPosts();
    const id = this.targetPostIdSignal();
    if (id) {
      const found = posts.find((p) => p.id === id);
      if (found) return found;
    }
    return posts.find((p) => p.kind === 'general') ?? posts[0] ?? null;
  });

  protected readonly selectedGoalRemaining = computed(() => {
    const sp = this.selectedPost();
    return sp ? getGoalRemainingAmount(sp) : null;
  });

  protected readonly effectiveSupportMin = computed(() => {
    const rem = this.selectedGoalRemaining();
    const baseMin = this.effectiveMinAmount();
    if (rem !== null && rem > 0 && rem < baseMin) {
      return rem;
    }
    return baseMin;
  });

  protected readonly effectiveSupportMax = computed(() => {
    const rem = this.selectedGoalRemaining();
    if (rem !== null && rem > 0) {
      return Math.min(this.maxSupportAmount, rem);
    }
    return this.maxSupportAmount;
  });

  protected readonly categoryLabel = computed(() => {
    const c = this.creator();
    return c ? this.activityCategoriesService.getLabel(c.category) : '';
  });

  protected readonly creatorAnimConfig = computed(() =>
    this.animationStore.getCreatorConfig(this.username()),
  );

  protected readonly activeThankYouAnim = computed(() =>
    this.animationStore.getActiveAnimation(this.username()),
  );

  protected readonly totalAmount = computed(() => {
    const raw = Number(this.amountSignal());
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
  });

  protected readonly formErrors = signal<Record<string, string>>({});
  protected readonly todayJalali = formatJalaliDate(new Date().toISOString());

  protected readonly formatToman = formatToman;
  protected readonly formatNumberFa = formatNumberFa;
  protected readonly formatJalaliDate = formatJalaliDate;
  protected readonly getGoalProgressPercent = getGoalProgressPercent;
  protected readonly getGoalRemainingAmount = getGoalRemainingAmount;
  protected readonly isGoalCompleted = isGoalCompleted;

  constructor() {
    effect(() => {
      // Reset state and default to the creator's general post only when switching creators
      const clean = this.username().replace(/^@/, '').toLowerCase();
      const general = untracked(() =>
        this.creatorService
          .posts()
          .find((p) => p.creatorUsername.toLowerCase() === clean && p.kind === 'general'),
      );
      this.coverFailed.set(false);
      this.avatarFailed.set(false);
      this.paymentSuccessMessage.set(null);
      this.celebrationOpen.set(false);
      this.submitted.set(false);
      this.shareModalOpen.set(false);
      this.supportForm.controls.targetPostId.setValue(general?.id ?? '', { emitEvent: true });
    });

    this.supportForm.controls.isAnonymous.valueChanges.subscribe((anon) => {
      if (anon) {
        this.supportForm.controls.name.disable();
      } else {
        this.supportForm.controls.name.enable();
      }
    });
  }

  protected selectQuickAmount(amount: number): void {
    this.supportForm.controls.amount.setValue(amount);
  }

  protected selectPostToSupport(post: CreatorPost): void {
    if (isGoalCompleted(post)) return;
    this.supportForm.controls.targetPostId.setValue(post.id);
    const rem = getGoalRemainingAmount(post);
    if (rem !== null && this.totalAmount() > rem) {
      this.supportForm.controls.amount.setValue(rem);
    }
    this.submitted.set(false);
    this.formErrors.set({});
    if (typeof document !== 'undefined') {
      document.getElementById('support-box')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  protected openPaymentPreview(): void {
    this.submitted.set(true);
    this.paymentSuccessMessage.set(null);
    const target = this.selectedPost();
    const amount = Number(this.supportForm.controls.amount.value);
    const errors = validateSupportForm({
      amount,
      minAmount: this.effectiveSupportMin(),
      name: this.supportForm.controls.name.value,
      isAnonymous: this.supportForm.controls.isAnonymous.value,
      message: this.supportForm.controls.message.value,
    });
    const limitErr = validatePostDonationLimit(target, amount);
    if (limitErr) {
      errors['amount'] = limitErr;
    }
    this.formErrors.set(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    this.paymentModalOpen.set(true);
  }

  protected async confirmPlaceholderPayment(): Promise<void> {
    const c = this.creator();
    if (!c) return;
    const target = this.selectedPost();
    const amount = this.totalAmount();
    const isAnon = this.supportForm.controls.isAnonymous.value;
    const supporterDisplayName = isAnon
      ? 'حامی ناشناس'
      : this.supportForm.controls.name.value.trim();

    this.processingPayment.set(true);
    await this.supportService.createSupport({
      creatorUsername: c.username,
      supporterName: this.supportForm.controls.name.value,
      isAnonymous: isAnon,
      amount,
      message: this.supportForm.controls.message.value,
      postId: target?.id,
      postTitle: target?.title,
    });
    this.processingPayment.set(false);
    this.paymentModalOpen.set(false);
    this.submitted.set(false);
    this.formErrors.set({});
    this.supportForm.patchValue({ name: '', message: '' });

    // If this donation completed the selected goal, switch back to the open general post
    if (target?.kind === 'goal') {
      const updated = this.orderedPosts().find((p) => p.id === target.id);
      if (updated && isGoalCompleted(updated)) {
        const general = this.orderedPosts().find((p) => p.kind === 'general');
        this.supportForm.controls.targetPostId.setValue(general?.id ?? '');
      }
    }

    this.paymentSuccessMessage.set(
      target
        ? `حمایت آزمایشی شما بابت «${target.title}» با موفقیت ثبت شد!`
        : 'حمایت آزمایشی شما با موفقیت روی دیوار حامیان ثبت شد!',
    );

    if (this.activeThankYouAnim().isPremium) {
      this.lastCelebration.set({
        supporterName: supporterDisplayName || 'حامی عزیز',
        amount,
        postTitle: target?.title,
      });
      this.celebrationOpen.set(true);
    }
  }
}
