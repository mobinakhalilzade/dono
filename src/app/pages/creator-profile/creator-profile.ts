import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { AppIcon } from '../../components/icon/icon';
import { ShareModalComponent } from '../../components/share-modal/share-modal';
import { ThankYouCelebrationComponent } from '../../components/thank-you-celebration/thank-you-celebration';
import { CATEGORY_LABELS, CreatorPost } from '../../models/dono.models';
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
  template: `
    @if (creator(); as c) {
      <section class="profile-page">
        <!-- Cover Banner -->
        <div class="cover-banner">
          @if (!coverFailed()) {
            <img
              [src]="c.coverUrl"
              [alt]="c.displayName"
              referrerpolicy="no-referrer"
              class="cover-banner-img"
              (error)="coverFailed.set(true)"
            />
          } @else {
            <div class="cover-banner-fallback" aria-hidden="true"></div>
          }
        </div>

        <div class="container profile-header-wrap">
          <div class="profile-identity surface-card">
            <div class="identity-top">
              <div class="avatar-box">
                @if (!avatarFailed()) {
                  <img
                    [src]="c.avatarUrl"
                    [alt]="c.displayName"
                    referrerpolicy="no-referrer"
                    class="avatar-img"
                    (error)="avatarFailed.set(true)"
                  />
                } @else {
                  <span class="avatar-fallback">{{ c.displayName.slice(0, 1) }}</span>
                }
              </div>

              <div class="identity-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="shareModalOpen.set(true)"
                >
                  <app-icon name="share" [size]="16" />
                  <span>اشتراک‌گذاری</span>
                </button>
              </div>
            </div>

            <div class="identity-text">
              <div class="name-line">
                <h1 class="creator-title">{{ c.displayName }}</h1>
                @if (c.verified) {
                  <span class="verified-label">
                    <app-icon name="verified" [size]="16" />
                    <span>تایید شده</span>
                  </span>
                }
              </div>

              <div class="meta-row">
                <span dir="ltr">&#64;{{ c.username }}</span>
                <span aria-hidden="true">·</span>
                <span>{{ categoryLabel() }}</span>
                <span aria-hidden="true">·</span>
                <span class="tabular-nums">{{ formatNumberFa(c.supportersCount) }} حامی</span>
                <span aria-hidden="true">·</span>
                <span>عضویت از {{ formatJalaliDate(c.createdAt) }}</span>
              </div>

              <p class="creator-tagline">{{ c.tagline }}</p>

              @if (c.socialLinks.length > 0) {
                <div class="social-row">
                  @for (link of c.socialLinks; track link.label) {
                    <a
                      [href]="link.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="social-link"
                    >
                      <app-icon name="external" [size]="14" />
                      <span>{{ link.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Two-Column Workspace -->
        <div class="container profile-columns">
          <!-- Support Box Column -->
          <aside class="support-column" id="support-box">
            <div class="surface-card support-card">
              <h2 class="support-title">
                <app-icon name="heart" [size]="20" />
                <span>حمایت از {{ c.displayName }}</span>
              </h2>
              <p class="support-rate tabular-nums">
                حداقل مبلغ حمایت: {{ formatToman(effectiveMinAmount()) }}
              </p>

              <div class="amount-chips" role="group" aria-label="انتخاب سریع مبلغ حمایت به تومان">
                @for (amt of quickAmounts; track amt) {
                  <button
                    type="button"
                    class="preset-btn tabular-nums"
                    [class.is-selected]="totalAmount() === amt"
                    [disabled]="selectedGoalRemaining() !== null && amt > selectedGoalRemaining()!"
                    (click)="selectQuickAmount(amt)"
                  >
                    {{ formatToman(amt) }}
                  </button>
                }
              </div>

              <form [formGroup]="supportForm" (ngSubmit)="openPaymentPreview()" novalidate class="support-form">
                @if (orderedPosts().length > 0) {
                  <div class="field-group">
                    <label for="support-target" class="field-label">مقصد حمایت</label>
                    <select id="support-target" formControlName="targetPostId" class="field-select">
                      @for (p of orderedPosts(); track p.id) {
                        @if (p.kind === 'general') {
                          <option [value]="p.id">{{ p.title }} (بدون سقف مبلغ)</option>
                        } @else if (!isGoalCompleted(p)) {
                          <option [value]="p.id">
                            {{ p.title }} (باقی‌مانده: {{ formatToman(getGoalRemainingAmount(p) ?? 0) }})
                          </option>
                        }
                      }
                    </select>
                    @if (selectedPost(); as sp) {
                      @if (sp.kind === 'goal') {
                        <span class="field-hint tabular-nums">
                          هدف مالی: {{ formatToman(sp.raisedAmount) }} از {{ formatToman(sp.targetAmount ?? 0) }} جمع‌آوری شده
                          (باقی‌مانده: {{ formatToman(getGoalRemainingAmount(sp) ?? 0) }})
                        </span>
                      } @else {
                        <span class="field-hint">
                          حمایت عمومی بدون سقف محدودیت مبلغ
                        </span>
                      }
                    }
                  </div>
                }

                <div class="field-group">
                  <label for="custom-amount" class="field-label">مبلغ حمایت دلخواه (تومان)</label>
                  <input
                    id="custom-amount"
                    type="number"
                    [min]="effectiveSupportMin()"
                    [max]="effectiveSupportMax()"
                    step="10000"
                    formControlName="amount"
                    class="field-input tabular-nums"
                    [class.is-invalid]="submitted() && !!formErrors()['amount']"
                    placeholder="مثلاً ۱۰۰۰۰۰"
                  />
                  @if (submitted() && formErrors()['amount']; as err) {
                    <span class="field-error">
                      <app-icon name="alert" [size]="14" />
                      <span>{{ err }}</span>
                    </span>
                  } @else {
                    <span class="field-hint tabular-nums">
                      بازه مجاز: {{ formatToman(effectiveSupportMin()) }} تا {{ formatToman(effectiveSupportMax()) }}
                    </span>
                  }
                </div>

                <div class="field-group">
                  <label for="supporter-name" class="field-label">نام یا لقب شما</label>
                  <input
                    id="supporter-name"
                    type="text"
                    formControlName="name"
                    class="field-input"
                    [class.is-invalid]="submitted() && !!formErrors()['name']"
                    placeholder="مثلاً علی یا نام مستعار"
                  />
                  @if (submitted() && formErrors()['name']; as err) {
                    <span class="field-error">
                      <app-icon name="alert" [size]="14" />
                      <span>{{ err }}</span>
                    </span>
                  }
                </div>

                <label class="checkbox-row">
                  <input type="checkbox" formControlName="isAnonymous" />
                  <span>حمایت به صورت ناشناس ثبت شود</span>
                </label>

                <div class="field-group">
                  <label for="supporter-msg" class="field-label">پیام حمایتی (اختیاری)</label>
                  <textarea
                    id="supporter-msg"
                    formControlName="message"
                    class="field-textarea"
                    [class.is-invalid]="submitted() && !!formErrors()['message']"
                    placeholder="یک جمله دلگرم‌کننده بنویسید..."
                  ></textarea>
                  @if (submitted() && formErrors()['message']; as err) {
                    <span class="field-error">
                      <app-icon name="alert" [size]="14" />
                      <span>{{ err }}</span>
                    </span>
                  }
                </div>

                @if (paymentSuccessMessage(); as okMsg) {
                  <div class="status-banner is-success" role="status">
                    <app-icon name="check" [size]="18" />
                    <span>{{ okMsg }}</span>
                  </div>
                }

                @if (activeThankYouAnim().isPremium) {
                  <div class="premium-anim-callout">
                    <app-icon name="sparkles" [size]="16" />
                    <span>پس از پرداخت، جشن تشکر «{{ activeThankYouAnim().name }}» نمایش داده می‌شود</span>
                  </div>
                }

                <button type="submit" class="btn btn-primary support-submit tabular-nums">
                  <span>تایید و حمایت به مبلغ {{ formatToman(totalAmount()) }}</span>
                </button>
              </form>
            </div>
          </aside>

          <!-- Main Content Column -->
          <div class="main-column">
            <section class="surface-card bio-card">
              <h2 class="section-subtitle">درباره {{ c.displayName }}</h2>
              <p class="bio-text">{{ c.bio }}</p>
            </section>

            <div class="content-tabs" role="tablist" aria-label="بخش‌های صفحه آفریننده">
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeTab() === 'posts'"
                class="tab-btn"
                [class.is-active]="activeTab() === 'posts'"
                (click)="activeTab.set('posts')"
              >
                <span>پست‌ها و اهداف</span>
                <span class="tab-count tabular-nums">({{ formatNumberFa(orderedPosts().length) }})</span>
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="activeTab() === 'supporters'"
                class="tab-btn"
                [class.is-active]="activeTab() === 'supporters'"
                (click)="activeTab.set('supporters')"
              >
                <span>دیوار حامیان</span>
                <span class="tab-count tabular-nums">({{ formatNumberFa(supporters().length) }})</span>
              </button>
            </div>

            @if (activeTab() === 'posts') {
              <div class="feed-list">
                @for (post of orderedPosts(); track post.id; let i = $index) {
                  <article class="surface-card feed-card" [style.--stagger]="i < 6 ? i : 5">
                    <div class="feed-head">
                      @if (post.kind === 'goal') {
                        <span
                          class="post-kind-badge"
                          [class.is-goal]="!isGoalCompleted(post)"
                          [class.is-completed]="isGoalCompleted(post)"
                        >
                          <app-icon [name]="isGoalCompleted(post) ? 'check' : 'target'" [size]="14" />
                          <span>{{ isGoalCompleted(post) ? 'هدف مالی · تکمیل شد' : 'هدف مالی مشخص' }}</span>
                        </span>
                      } @else {
                        <span class="post-kind-badge">
                          <app-icon name="heart" [size]="14" />
                          <span>پست عمومی · بدون سقف مبلغ</span>
                        </span>
                      }
                      <div class="meta-row">
                        <span>{{ formatJalaliDate(post.createdAt) }}</span>
                        <span aria-hidden="true">·</span>
                        <span class="tabular-nums">{{ formatNumberFa(post.likesCount) }} پسند</span>
                      </div>
                    </div>

                    <h3 class="post-title">{{ post.title }}</h3>
                    <p class="feed-message">{{ post.content }}</p>

                    @if (post.kind === 'goal' && post.targetAmount) {
                      @let pct = getGoalProgressPercent(post) ?? 0;
                      @let rem = getGoalRemainingAmount(post) ?? 0;
                      <div class="goal-progress-box">
                        <div class="goal-stats-row">
                          <span class="goal-raised-strong tabular-nums">
                            {{ formatToman(post.raisedAmount) }} جمع‌آوری شده از {{ formatToman(post.targetAmount) }}
                          </span>
                          <span class="goal-percent-tag tabular-nums">{{ formatNumberFa(pct) }}٪</span>
                        </div>
                        <div class="goal-track" role="progressbar" [attr.aria-valuenow]="pct" aria-valuemin="0" aria-valuemax="100">
                          <div class="goal-fill" [class.is-complete]="isGoalCompleted(post)" [style.inline-size.%]="pct"></div>
                        </div>
                        <div class="goal-sub-row">
                          <span class="tabular-nums">
                            {{ isGoalCompleted(post) ? 'تمام مبلغ هدف تامین شده است' : 'باقی‌مانده تا سقف: ' + formatToman(rem) }}
                          </span>
                          <span class="tabular-nums">سقف: {{ formatToman(post.targetAmount) }}</span>
                        </div>
                      </div>
                    } @else {
                      <div class="goal-progress-box">
                        <div class="goal-stats-row">
                          <span class="goal-raised-strong tabular-nums">
                            مجموع حمایت از این پست: {{ formatToman(post.raisedAmount) }}
                          </span>
                          <span class="field-hint">بدون محدودیت سقف</span>
                        </div>
                      </div>
                    }

                    <div class="post-card-footer">
                      <button
                        type="button"
                        class="btn btn-sm"
                        [class.btn-primary]="post.kind === 'general'"
                        [class.btn-warm]="post.kind === 'goal' && !isGoalCompleted(post)"
                        [class.btn-secondary]="isGoalCompleted(post)"
                        [disabled]="isGoalCompleted(post)"
                        (click)="selectPostToSupport(post)"
                      >
                        <app-icon [name]="post.kind === 'goal' ? 'target' : 'heart'" [size]="15" />
                        <span>
                          @if (isGoalCompleted(post)) {
                            سقف هدف تکمیل شده است
                          } @else if (post.kind === 'goal') {
                            حمایت از این هدف
                          } @else {
                            حمایت از این پست
                          }
                        </span>
                      </button>
                    </div>
                  </article>
                } @empty {
                  <div class="surface-card empty-box">
                    <app-icon name="edit" [size]="28" />
                    <p>این آفریننده هنوز پستی منتشر نکرده است.</p>
                  </div>
                }
              </div>
            } @else {
              <div class="feed-list">
                @for (sup of supporters(); track sup.id; let i = $index) {
                  <article class="surface-card feed-card" [style.--stagger]="i < 6 ? i : 5">
                    <div class="feed-head">
                      <strong class="supporter-name">{{ sup.supporterName }}</strong>
                      <div class="meta-row">
                        <span class="support-amount-pill tabular-nums">{{ formatToman(sup.amount) }}</span>
                        <span aria-hidden="true">·</span>
                        <span>{{ formatJalaliDate(sup.createdAt) }}</span>
                      </div>
                    </div>
                    @if (sup.postTitle) {
                      <span class="supporter-target-note">بابت: {{ sup.postTitle }}</span>
                    }
                    @if (sup.message) {
                      <p class="feed-message">{{ sup.message }}</p>
                    }
                  </article>
                } @empty {
                  <div class="surface-card empty-box">
                    <app-icon name="heart" [size]="28" />
                    <p>هنوز حمایتی ثبت نشده است. اولین حامی {{ c.displayName }} باشید!</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Share Modal (Link + QR + Web Share) -->
        <app-share-modal
          [open]="shareModalOpen()"
          [username]="c.username"
          [displayName]="c.displayName"
          (closed)="shareModalOpen.set(false)"
        />

        <!-- Placeholder Payment Step Modal -->
        @if (paymentModalOpen()) {
          <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
            <div class="surface-card modal-card">
              <div class="modal-head">
                <h2 id="payment-modal-title" class="modal-title">پیش‌نمایش درگاه پرداخت آزمایشی</h2>
                <button
                  type="button"
                  class="icon-close-btn"
                  aria-label="بستن پنجره پرداخت"
                  (click)="paymentModalOpen.set(false)"
                >
                  <app-icon name="close" [size]="18" />
                </button>
              </div>

              <p class="modal-note">
                این یک مرحله پرداخت آزمایشی است و هیچ وجه واقعی از حساب شما کسر نمی‌شود.
              </p>

              <dl class="invoice-list">
                <div class="invoice-row">
                  <dt>گیرنده حمایت</dt>
                  <dd>{{ c.displayName }}</dd>
                </div>
                @if (selectedPost(); as sp) {
                  <div class="invoice-row">
                    <dt>بابت</dt>
                    <dd>{{ sp.title }}</dd>
                  </div>
                }
                <div class="invoice-row">
                  <dt>نام حامی</dt>
                  <dd>{{ supportForm.controls.isAnonymous.value ? 'حامی ناشناس' : supportForm.controls.name.value }}</dd>
                </div>
                <div class="invoice-row">
                  <dt>تاریخ</dt>
                  <dd>{{ todayJalali }}</dd>
                </div>
                <div class="invoice-row invoice-total">
                  <dt>مبلغ حمایت</dt>
                  <dd class="tabular-nums">{{ formatToman(totalAmount()) }}</dd>
                </div>
              </dl>

              <div class="modal-actions">
                <button
                  type="button"
                  class="btn btn-primary"
                  [disabled]="processingPayment()"
                  (click)="confirmPlaceholderPayment()"
                >
                  <app-icon name="check" [size]="18" />
                  <span>{{ processingPayment() ? 'در حال ثبت...' : 'تایید و پرداخت آزمایشی' }}</span>
                </button>
                <button type="button" class="btn btn-secondary" (click)="paymentModalOpen.set(false)">
                  انصراف
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Premium Post-Payment Thank-You Celebration Overlay -->
        @if (lastCelebration(); as cel) {
          <app-thank-you-celebration
            [open]="celebrationOpen()"
            [animationId]="activeThankYouAnim().id"
            [creatorName]="c.displayName"
            [creatorAvatarUrl]="c.avatarUrl"
            [creatorVerified]="c.verified"
            [supporterName]="cel.supporterName"
            [amount]="cel.amount"
            [postTitle]="cel.postTitle"
            [thankYouNote]="creatorAnimConfig().thankYouNote"
            [previewMode]="false"
            (closed)="celebrationOpen.set(false)"
          />
        }
      </section>
    } @else {
      <section class="container not-found-creator">
        <div class="surface-card empty-box">
          <app-icon name="alert" [size]="32" />
          <h1>صفحه آفریننده پیدا نشد</h1>
          <p>آدرس وارد شده معتبر نیست یا این صفحه هنوز ساخته نشده است.</p>
          <a routerLink="/explore" class="btn btn-primary">بازگشت به فهرست آفرینندگان</a>
        </div>
      </section>
    }
  `,
  styles: `
    .cover-banner {
      block-size: 190px;
      background-color: var(--bg-subtle);
      overflow: hidden;
    }

    @media (min-width: 768px) {
      .cover-banner {
        block-size: 250px;
      }
    }

    .cover-banner-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-banner-fallback {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--accent-soft), var(--bg-subtle));
    }

    .profile-header-wrap {
      margin-block-start: -3.25rem;
      position: relative;
      z-index: 5;
    }

    .profile-identity {
      padding: 1.25rem;
      animation: dastFadeSlideUp 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @media (min-width: 768px) {
      .profile-identity {
        padding: 1.75rem;
      }
    }

    .identity-top {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-block-start: -3.75rem;
      margin-block-end: 0.85rem;
    }

    .avatar-box {
      inline-size: 92px;
      block-size: 92px;
      border-radius: 20px;
      border: 4px solid var(--bg-surface);
      background-color: var(--bg-subtle);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-fallback {
      font-size: 1.75rem;
      font-weight: 800;
    }

    .name-line {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem;
    }

    .creator-title {
      margin: 0;
      font-size: clamp(1.45rem, 2.5vw, 2rem);
      font-weight: 800;
    }

    .verified-label {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--warning-text);
    }

    .creator-tagline {
      margin: 0.65rem 0 0;
      font-size: 1rem;
      color: var(--text-secondary);
    }

    .social-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.25rem;
      margin-block-start: 0.9rem;
    }

    .social-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .social-link:hover {
      text-decoration: underline;
      text-underline-offset: 4px;
    }

    .profile-columns {
      margin-block-start: 1.75rem;
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    @media (min-width: 960px) {
      .profile-columns {
        grid-template-columns: 380px 1fr;
        gap: 2rem;
      }
      .support-column {
        position: sticky;
        inset-block-start: 84px;
      }
    }

    .support-card {
      padding: 1.5rem;
      border-block-start: 3px solid var(--accent);
      animation: dastFadeSlideUp 420ms 60ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .support-title {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 800;
    }

    .support-title app-icon {
      color: var(--secondary-accent-ink);
    }

    .support-rate {
      margin: 0.35rem 0 1rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .amount-chips {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-block-end: 1.15rem;
    }

    .preset-btn {
      min-block-size: 42px;
      padding-inline: 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background-color: var(--bg-canvas);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        background-color var(--transition-fast),
        border-color var(--transition-fast),
        color var(--transition-fast),
        transform var(--transition-fast);
    }

    .preset-btn:hover:not(.is-selected) {
      border-color: var(--secondary-accent-border);
      transform: translateY(-1px);
    }

    .preset-btn:active {
      transform: scale(0.96);
    }

    .preset-btn.is-selected {
      background-color: var(--accent);
      color: var(--accent-text);
      border-color: var(--accent-hover);
      font-weight: 700;
      transform: scale(1.015);
    }

    .support-form {
      display: flex;
      flex-direction: column;
      gap: 0.95rem;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
    }

    .checkbox-row input {
      inline-size: 18px;
      block-size: 18px;
      accent-color: var(--accent-hover);
    }

    .support-submit {
      width: 100%;
    }

    .status-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .status-banner.is-success {
      background-color: var(--success-bg);
      color: var(--success-text);
    }

    .main-column {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .bio-card {
      padding: 1.5rem;
    }

    .section-subtitle {
      margin: 0 0 0.65rem;
      font-size: 1.0625rem;
      font-weight: 700;
    }

    .bio-text {
      margin: 0;
      color: var(--text-secondary);
      white-space: pre-line;
    }

    .content-tabs {
      display: flex;
      gap: 0.5rem;
      border-block-end: 1px solid var(--border-subtle);
      padding-block-end: 0.5rem;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      min-block-size: 40px;
      padding-inline: 1rem;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      background: transparent;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      transition:
        background-color var(--transition-fast),
        border-color var(--transition-fast),
        color var(--transition-fast),
        transform var(--transition-fast);
    }

    .tab-btn:active {
      transform: scale(0.97);
    }

    .tab-btn.is-active {
      background-color: var(--secondary-accent-soft);
      border-color: var(--secondary-accent-border);
      color: var(--secondary-accent-ink);
    }

    .tab-count {
      font-size: 0.8125rem;
      color: inherit;
      opacity: 0.85;
    }

    .feed-list {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .feed-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      animation: dastFadeSlideUp 340ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger, 0) * 55ms);
    }

    .feed-card:hover {
      border-color: var(--accent-border);
      transform: translateY(-2px);
    }

    .feed-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .supporter-name {
      font-size: 1rem;
      font-weight: 700;
    }

    .support-amount-pill {
      padding: 0.15rem 0.55rem;
      border-radius: 8px;
      background-color: var(--secondary-accent-soft);
      font-weight: 700;
      color: var(--secondary-accent-ink);
    }

    .post-title {
      margin: 0.2rem 0 0;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .feed-message {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
      font-size: 0.9375rem;
    }

    .post-card-footer {
      margin-block-start: 0.4rem;
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }

    .supporter-target-note {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .preset-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .empty-box {
      padding: 2.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.75rem;
      color: var(--text-secondary);
    }

    .empty-box p,
    .empty-box h1 {
      margin: 0;
    }

    .not-found-creator {
      padding-block: 4rem;
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 60;
      background-color: rgba(18, 18, 16, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: dastBackdropIn 180ms ease-out both;
    }

    .modal-card {
      width: 100%;
      max-inline-size: 460px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      animation: dastModalPop 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .modal-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
    }

    .icon-close-btn {
      inline-size: 36px;
      block-size: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .modal-note {
      margin: 0;
      font-size: 0.875rem;
      padding: 0.75rem;
      border-radius: var(--radius-md);
      background-color: var(--accent-soft);
      color: var(--text-primary);
    }

    .invoice-list {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .invoice-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.9375rem;
    }

    .invoice-row dt {
      color: var(--text-secondary);
    }

    .invoice-row dd {
      margin: 0;
      font-weight: 600;
    }

    .invoice-total {
      padding-block-start: 0.65rem;
      border-block-start: 1px solid var(--border-subtle);
      font-size: 1.05rem;
      font-weight: 800;
    }

    .modal-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-block-start: 0.25rem;
    }
  `,
})
export class CreatorProfileComponent {
  private readonly creatorService = inject(CreatorService);
  private readonly supportService = inject(SupportService);
  private readonly animationStore = inject(AnimationStoreService);

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
    return c ? CATEGORY_LABELS[c.category] : '';
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
