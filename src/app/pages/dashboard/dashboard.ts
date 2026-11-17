import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppIcon, IconName } from '../../components/icon/icon';
import { ShareModalComponent } from '../../components/share-modal/share-modal';
import { ThankYouCelebrationComponent } from '../../components/thank-you-celebration/thank-you-celebration';
import { COVER_CREATIVE_URL, COVER_PODCAST_URL, HERO_IMAGE_URL } from '../../data/mock-data';
import {
  CATEGORY_LABELS,
  CreatorCategory,
  PostKind,
  ThankYouAnimationId,
  ThankYouAnimationPack,
} from '../../models/dono.models';
import { AnimationStoreService } from '../../services/animation-store.service';
import { AuthService } from '../../services/auth.service';
import { CreatorService } from '../../services/creator.service';
import { SupportService } from '../../services/support.service';
import { ThemeService } from '../../services/theme.service';
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
  template: `
    <section class="dashboard-section">
      <div class="container">
        @if (!activeCreator()) {
          <div class="surface-card auth-gate">
            <app-icon name="lock" [size]="32" />
            <h1>دسترسی به داشبورد آفریننده</h1>
            <p>
              برای مشاهده درآمد، مدیریت حامیان و ویرایش صفحه، ابتدا وارد حساب خود شوید یا از پیش‌نمایش حساب نمونه استفاده کنید.
            </p>
            <div class="gate-actions">
              <a routerLink="/login" class="btn btn-primary">ورود با گوگل</a>
              <button type="button" class="btn btn-secondary" (click)="enterDemoCreator()">
                ورود سریع با حساب نمونه سارا محمدی
              </button>
            </div>
          </div>
        } @else {
          <div class="dashboard-shell">
            <!-- Sidebar -->
            <aside class="surface-card dash-sidebar">
              <div class="sidebar-profile">
                <img
                  [src]="activeCreator()!.avatarUrl"
                  [alt]="activeCreator()!.displayName"
                  referrerpolicy="no-referrer"
                  class="sidebar-avatar"
                />
                <div class="sidebar-meta">
                  <strong>{{ activeCreator()!.displayName }}</strong>
                  <span dir="ltr">@{{ activeCreator()!.username }}</span>
                </div>
              </div>

              <nav class="dash-nav" aria-label="منوی داشبورد">
                <button
                  type="button"
                  class="dash-nav-btn"
                  [class.is-active]="activeTab() === 'overview'"
                  (click)="activeTab.set('overview')"
                >
                  <app-icon name="chart" [size]="18" />
                  <span>نمای کلی</span>
                </button>
                <button
                  type="button"
                  class="dash-nav-btn"
                  [class.is-active]="activeTab() === 'posts'"
                  (click)="activeTab.set('posts')"
                >
                  <app-icon name="target" [size]="18" />
                  <span>پست‌ها و اهداف</span>
                </button>
                <button
                  type="button"
                  class="dash-nav-btn"
                  [class.is-active]="activeTab() === 'animations'"
                  (click)="activeTab.set('animations')"
                >
                  <app-icon name="sparkles" [size]="18" />
                  <span>انیمیشن‌های تشکر</span>
                </button>
                <button
                  type="button"
                  class="dash-nav-btn"
                  [class.is-active]="activeTab() === 'supporters'"
                  (click)="activeTab.set('supporters')"
                >
                  <app-icon name="users" [size]="18" />
                  <span>حامیان</span>
                </button>
                <button
                  type="button"
                  class="dash-nav-btn"
                  [class.is-active]="activeTab() === 'payouts'"
                  (click)="activeTab.set('payouts')"
                >
                  <app-icon name="wallet" [size]="18" />
                  <span>تسویه حساب</span>
                </button>
                <button
                  type="button"
                  class="dash-nav-btn"
                  [class.is-active]="activeTab() === 'editor'"
                  (click)="activeTab.set('editor')"
                >
                  <app-icon name="edit" [size]="18" />
                  <span>ویرایشگر صفحه</span>
                </button>
                <button
                  type="button"
                  class="dash-nav-btn"
                  [class.is-active]="activeTab() === 'settings'"
                  (click)="activeTab.set('settings')"
                >
                  <app-icon name="settings" [size]="18" />
                  <span>تنظیمات</span>
                </button>
              </nav>

              <div class="sidebar-footer">
                <button
                  type="button"
                  class="btn btn-primary btn-sm full-w"
                  (click)="shareModalOpen.set(true)"
                >
                  <app-icon name="share" [size]="15" />
                  <span>اشتراک‌گذاری</span>
                </button>
                <a [routerLink]="['/c', activeCreator()!.username]" class="btn btn-secondary btn-sm full-w">
                  <app-icon name="external" [size]="15" />
                  <span>مشاهده صفحه عمومی</span>
                </a>
              </div>
            </aside>

            <!-- Main Workspace -->
            <div class="dash-main">
              @switch (activeTab()) {
                @case ('overview') {
                  <header class="dash-head-row">
                    <div>
                      <h1 class="dash-title">نمای کلی درآمد و حمایت‌ها</h1>
                      <p class="dash-subtitle">گزارش لحظه‌ای مبالغ دریافتی به تومان</p>
                    </div>
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      (click)="shareModalOpen.set(true)"
                    >
                      <app-icon name="share" [size]="16" />
                      <span>اشتراک‌گذاری صفحه</span>
                    </button>
                  </header>

                  <div class="kpi-grid">
                    <article class="surface-card kpi-card">
                      <span class="kpi-label">کل درآمد ثبت‌شده</span>
                      <strong class="kpi-value tabular-nums">{{ formatToman(activeCreator()!.totalRaised) }}</strong>
                    </article>
                    <article class="surface-card kpi-card">
                      <span class="kpi-label">تعداد کل حامیان</span>
                      <strong class="kpi-value tabular-nums">{{ formatNumberFa(activeCreator()!.supportersCount) }} نفر</strong>
                    </article>
                    <article class="surface-card kpi-card kpi-card-warm">
                      <span class="kpi-label">موجودی قابل تسویه</span>
                      <strong class="kpi-value kpi-value-warm tabular-nums">{{ formatToman(availableBalance()) }}</strong>
                    </article>
                  </div>

                  <section class="surface-card chart-card">
                    <div class="chart-head">
                      <div>
                        <h2 class="card-title">نمودار درآمد شش‌ماهه</h2>
                        <p class="card-desc">روند دریافت حمایت‌های ماهانه (تومان)</p>
                      </div>
                      <span class="chart-unit">واحد: تومان</span>
                    </div>

                    @if (hasEarnings()) {
                      <div class="bar-chart" role="img" aria-label="نمودار درآمد شش ماه اخیر">
                        @for (m of earnings(); track m.monthLabel; let i = $index) {
                          <div class="bar-col" [style.--bar-idx]="i">
                            <span class="bar-amount tabular-nums">{{ formatShortToman(m.amount) }}</span>
                            <div class="bar-track">
                              <div
                                class="bar-fill"
                                [style.block-size.%]="barHeightPercent(m.amount)"
                                [title]="m.monthLabel + ': ' + formatToman(m.amount)"
                              ></div>
                            </div>
                            <span class="bar-month">{{ m.monthLabel }}</span>
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="empty-inner">
                        <app-icon name="chart" [size]="28" />
                        <p>با دریافت اولین حمایت، نمودار درآمد ماهانه شما در اینجا رسم می‌شود.</p>
                      </div>
                    }
                  </section>

                  <section class="surface-card recent-card">
                    <div class="card-head-row">
                      <h2 class="card-title">آخرین حمایت‌ها</h2>
                      <button type="button" class="link-btn" (click)="activeTab.set('supporters')">
                        مشاهده همه
                      </button>
                    </div>

                    @if (supporters().length > 0) {
                      <div class="table-wrap">
                        <table class="data-table">
                          <thead>
                            <tr>
                              <th>حامی</th>
                              <th>پیام</th>
                              <th>مبلغ</th>
                              <th>تاریخ</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (s of supporters().slice(0, 4); track s.id) {
                              <tr>
                                <td>{{ s.supporterName }}</td>
                                <td class="msg-cell">{{ s.message || '—' }}</td>
                                <td class="tabular-nums">{{ formatToman(s.amount) }}</td>
                                <td>{{ formatJalaliDate(s.createdAt) }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else {
                      <p class="empty-inline">هنوز حمایتی دریافت نکرده‌اید.</p>
                    }
                  </section>
                }

                @case ('posts') {
                  <header class="dash-head-row">
                    <div>
                      <h1 class="dash-title">پست‌ها و اهداف مالی</h1>
                      <p class="dash-subtitle">
                        پست حمایت عمومی (بدون سقف مبلغ) یا هدف مالی با سقف مشخص بسازید و پیشرفت آن را دنبال کنید
                      </p>
                    </div>
                    <a [routerLink]="['/c', activeCreator()!.username]" class="btn btn-secondary btn-sm">
                      <app-icon name="external" [size]="16" />
                      <span>مشاهده در صفحه من</span>
                    </a>
                  </header>

                  <div class="surface-card form-card">
                    <h2 class="card-title">انتشار پست یا هدف مالی جدید</h2>
                    <form [formGroup]="postForm" (ngSubmit)="publishPost()" novalidate class="dash-form">
                      <div class="field-group">
                        <span class="field-label">نوع پست</span>
                        <div class="kind-selector" role="radiogroup" aria-label="انتخاب نوع پست">
                          <button
                            type="button"
                            class="kind-option"
                            [class.is-goal-active]="postKind() === 'goal'"
                            (click)="setPostKind('goal')"
                          >
                            <app-icon name="target" [size]="20" />
                            <div class="kind-option-text">
                              <strong>هدف مالی مشخص (با سقف مبلغ)</strong>
                              <span>برای سفر، خرید تجهیزات، چاپ کتاب یا پروژه مشخص با نوار پیشرفت</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            class="kind-option"
                            [class.is-active]="postKind() === 'general'"
                            (click)="setPostKind('general')"
                          >
                            <app-icon name="heart" [size]="20" />
                            <div class="kind-option-text">
                              <strong>پست حمایت عمومی (بدون سقف)</strong>
                              <span>حمایت آزاد و همیشگی بدون هیچ محدودیت مبلغ</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      @if (postKind() === 'goal') {
                        <div class="field-group">
                          <label for="post-target" class="field-label">سقف مبلغ مورد نیاز (تومان)</label>
                          <div class="quick-targets-row">
                            @for (targetOpt of quickGoalTargets; track targetOpt) {
                              <button
                                type="button"
                                class="target-chip tabular-nums"
                                [class.is-selected]="postTargetAmount() === targetOpt"
                                (click)="setQuickGoalTarget(targetOpt)"
                              >
                                {{ formatToman(targetOpt) }}
                              </button>
                            }
                          </div>
                          <input
                            id="post-target"
                            type="number"
                            min="10000"
                            step="500000"
                            formControlName="targetAmount"
                            class="field-input tabular-nums"
                            [class.is-invalid]="postSubmitted() && !!postErrors()['targetAmount']"
                          />
                          @if (postSubmitted() && postErrors()['targetAmount']; as err) {
                            <span class="field-error">
                              <app-icon name="alert" [size]="14" />
                              <span>{{ err }}</span>
                            </span>
                          }
                        </div>
                      }

                      <div class="field-group">
                        <label for="post-title" class="field-label">عنوان پست یا هدف</label>
                        <input
                          id="post-title"
                          type="text"
                          formControlName="title"
                          class="field-input"
                          [class.is-invalid]="postSubmitted() && !!postErrors()['title']"
                          [placeholder]="
                            postKind() === 'goal'
                              ? 'مثلاً سفر عکاسی به کویر یا خرید میکروفون استودیویی'
                              : 'مثلاً حمایت آزاد ماهانه یا گزارش پیشرفت کارها'
                          "
                        />
                        @if (postSubmitted() && postErrors()['title']; as err) {
                          <span class="field-error">
                            <app-icon name="alert" [size]="14" />
                            <span>{{ err }}</span>
                          </span>
                        }
                      </div>

                      <div class="field-group">
                        <label for="post-content" class="field-label">توضیحات</label>
                        <textarea
                          id="post-content"
                          formControlName="content"
                          class="field-textarea"
                          [class.is-invalid]="postSubmitted() && !!postErrors()['content']"
                          [placeholder]="
                            postKind() === 'goal'
                              ? 'توضیح دهید این مبلغ صرف چه هدفی می‌شود و چه نتیجه‌ای برای دنبال‌کنندگان دارد...'
                              : 'پیام یا گزارش خود را برای حامیان بنویسید...'
                          "
                        ></textarea>
                        @if (postSubmitted() && postErrors()['content']; as err) {
                          <span class="field-error">
                            <app-icon name="alert" [size]="14" />
                            <span>{{ err }}</span>
                          </span>
                        }
                      </div>

                      @if (postPublished()) {
                        <div class="status-banner is-success" role="status">
                          <app-icon name="check" [size]="18" />
                          <span>
                            پست جدید منتشر شد و هم‌اکنون در صفحه عمومی شما قابل حمایت است.
                          </span>
                        </div>
                      }

                      <button
                        type="submit"
                        class="btn"
                        [class.btn-warm]="postKind() === 'goal'"
                        [class.btn-primary]="postKind() !== 'goal'"
                      >
                        <app-icon name="plus" [size]="18" />
                        <span>{{ postKind() === 'goal' ? 'انتشار هدف مالی' : 'انتشار پست عمومی' }}</span>
                      </button>
                    </form>
                  </div>

                  <div class="surface-card form-card">
                    <div class="card-head-row">
                      <div>
                        <h2 class="card-title">پست‌ها و اهداف فعال شما ({{ formatNumberFa(creatorPosts().length) }})</h2>
                        <p class="card-desc">پست‌های عمومی سقف ندارند؛ اهداف مالی پیشرفت جمع‌آوری را نمایش می‌دهند.</p>
                      </div>
                    </div>

                    <div class="dash-posts-list">
                      @for (post of creatorPosts(); track post.id) {
                        <article class="dash-post-item">
                          <div class="dash-post-head">
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
                            <span class="field-hint">{{ formatJalaliDate(post.createdAt) }}</span>
                          </div>

                          <h3 class="dash-post-title">{{ post.title }}</h3>
                          <p class="dash-post-content">{{ post.content }}</p>

                          @if (post.kind === 'goal' && post.targetAmount) {
                            <div class="goal-progress-box">
                              <div class="goal-stats-row">
                                <span class="goal-raised-strong tabular-nums">
                                  جمع‌آوری شده: {{ formatToman(post.raisedAmount) }} از {{ formatToman(post.targetAmount) }}
                                </span>
                                <span class="goal-percent-tag tabular-nums">
                                  {{ formatNumberFa(getGoalProgressPercent(post) ?? 0) }}٪
                                </span>
                              </div>
                              <div class="goal-track">
                                <div
                                  class="goal-fill"
                                  [class.is-complete]="isGoalCompleted(post)"
                                  [style.inline-size.%]="getGoalProgressPercent(post) ?? 0"
                                ></div>
                              </div>
                              <div class="goal-sub-row">
                                <span>سقف هدف: {{ formatToman(post.targetAmount) }}</span>
                                @if (isGoalCompleted(post)) {
                                  <span>این هدف به طور کامل تامین شد</span>
                                } @else {
                                  <span>باقی‌مانده: {{ formatToman(getGoalRemainingAmount(post) ?? 0) }}</span>
                                }
                              </div>
                            </div>
                          } @else {
                            <div class="goal-progress-box">
                              <div class="goal-stats-row">
                                <span class="goal-raised-strong tabular-nums">
                                  مجموع حمایت‌های این پست: {{ formatToman(post.raisedAmount) }}
                                </span>
                                <span class="field-hint">بدون سقف محدودیت مبلغ</span>
                              </div>
                            </div>
                          }

                          <div class="dash-post-actions">
                            <a [routerLink]="['/c', activeCreator()!.username]" class="link-btn">
                              مشاهده در صفحه عمومی
                            </a>
                            @if (post.kind === 'goal' || generalPostsCount() > 1) {
                              <button type="button" class="btn-danger-ghost" (click)="removePost(post.id)">
                                <app-icon name="trash" [size]="15" />
                                <span>حذف پست</span>
                              </button>
                            } @else {
                              <span class="field-hint">پست عمومی پایه صفحه</span>
                            }
                          </div>
                        </article>
                      }
                    </div>
                  </div>
                }

                @case ('supporters') {
                  <header class="dash-head">
                    <h1 class="dash-title">فهرست حامیان</h1>
                    <p class="dash-subtitle">جست‌وجو و مرور پیام‌های ارسالی حامیان</p>
                  </header>

                  <div class="surface-card table-card">
                    <div class="table-toolbar">
                      <label for="sup-search" class="sr-only">جست‌وجوی حامی</label>
                      <input
                        id="sup-search"
                        type="search"
                        [formControl]="supporterSearch"
                        class="field-input"
                        placeholder="جست‌وجو بر اساس نام یا متن پیام..."
                      />
                    </div>

                    @if (filteredSupporters().length > 0) {
                      <div class="table-wrap">
                        <table class="data-table">
                          <thead>
                            <tr>
                              <th>حامی</th>
                              <th>پیام</th>
                              <th>مبلغ</th>
                              <th>تاریخ</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (s of filteredSupporters(); track s.id) {
                              <tr>
                                <td class="fw-600">{{ s.supporterName }}</td>
                                <td class="msg-cell">{{ s.message || '—' }}</td>
                                <td class="tabular-nums">{{ formatToman(s.amount) }}</td>
                                <td class="nowrap">{{ formatJalaliDate(s.createdAt) }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else {
                      <div class="empty-inner">
                        <app-icon name="users" [size]="28" />
                        <p>حامی‌ای مطابق جست‌وجوی شما یافت نشد.</p>
                      </div>
                    }
                  </div>
                }

                @case ('payouts') {
                  <header class="dash-head">
                    <h1 class="dash-title">تسویه حساب و واریز شبا</h1>
                    <p class="dash-subtitle">موجودی قابل برداشت: {{ formatToman(availableBalance()) }}</p>
                  </header>

                  <div class="surface-card form-card">
                    <h2 class="card-title">ثبت درخواست تسویه جدید</h2>
                    <form [formGroup]="payoutForm" (ngSubmit)="submitPayout()" novalidate class="dash-form">
                      <div class="two-cols">
                        <div class="field-group">
                          <label for="pay-amount" class="field-label">مبلغ درخواست (تومان)</label>
                          <input
                            id="pay-amount"
                            type="number"
                            min="100000"
                            step="50000"
                            formControlName="amount"
                            class="field-input tabular-nums"
                            [class.is-invalid]="payoutSubmitted() && !!payoutErrors()['amount']"
                          />
                          @if (payoutSubmitted() && payoutErrors()['amount']; as err) {
                            <span class="field-error">
                              <app-icon name="alert" [size]="14" />
                              <span>{{ err }}</span>
                            </span>
                          }
                        </div>

                        <div class="field-group">
                          <label for="pay-sheba" class="field-label">شماره شبا (IR...)</label>
                          <input
                            id="pay-sheba"
                            type="text"
                            dir="ltr"
                            formControlName="sheba"
                            class="field-input tabular-nums"
                            [class.is-invalid]="payoutSubmitted() && !!payoutErrors()['sheba']"
                            placeholder="IR820540102680020817909002"
                          />
                          @if (payoutSubmitted() && payoutErrors()['sheba']; as err) {
                            <span class="field-error">
                              <app-icon name="alert" [size]="14" />
                              <span>{{ err }}</span>
                            </span>
                          }
                        </div>
                      </div>

                      @if (payoutSuccess()) {
                        <div class="status-banner is-success" role="status">
                          <app-icon name="check" [size]="18" />
                          <span>درخواست تسویه با موفقیت ثبت شد و در صف بررسی قرار گرفت.</span>
                        </div>
                      }

                      <button type="submit" class="btn btn-primary">
                        <span>ثبت درخواست تسویه</span>
                      </button>
                    </form>
                  </div>

                  <div class="surface-card table-card">
                    <h2 class="card-title table-title">تاریخچه واریزها</h2>
                    @if (payouts().length > 0) {
                      <div class="table-wrap">
                        <table class="data-table">
                          <thead>
                            <tr>
                              <th>تاریخ</th>
                              <th>شماره شبا</th>
                              <th>مبلغ</th>
                              <th>وضعیت</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (p of payouts(); track p.id) {
                              <tr>
                                <td>{{ formatJalaliDate(p.createdAt) }}</td>
                                <td dir="ltr" class="tabular-nums">{{ p.ibanMasked }}</td>
                                <td class="tabular-nums">{{ formatToman(p.amount) }}</td>
                                <td>
                                  @if (p.status === 'paid') {
                                    <span class="status-text is-paid">
                                      <app-icon name="check" [size]="14" />
                                      <span>پرداخت شده</span>
                                    </span>
                                  } @else {
                                    <span class="status-text is-pending">
                                      <app-icon name="wallet" [size]="14" />
                                      <span>در حال بررسی</span>
                                    </span>
                                  }
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else {
                      <div class="empty-inner">
                        <p>هنوز هیچ درخواست تسویه‌ای ثبت نشده است.</p>
                      </div>
                    }
                  </div>
                }

                @case ('editor') {
                  <header class="dash-head-row">
                    <div>
                      <h1 class="dash-title">ویرایشگر صفحه آفریننده</h1>
                      <p class="dash-subtitle">تغییرات بلافاصله روی صفحه عمومی شما نمایش داده می‌شوند</p>
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" (click)="activeTab.set('posts')">
                      <app-icon name="target" [size]="16" />
                      <span>مدیریت پست‌ها و اهداف</span>
                    </button>
                  </header>

                  <div class="surface-card form-card">
                    <h2 class="card-title">اطلاعات صفحه آفریننده</h2>
                    <form [formGroup]="editorForm" (ngSubmit)="saveProfile()" novalidate class="dash-form">
                      <div class="two-cols">
                        <div class="field-group">
                          <label for="ed-name" class="field-label">نام نمایشی</label>
                          <input
                            id="ed-name"
                            type="text"
                            formControlName="displayName"
                            class="field-input"
                            [class.is-invalid]="editorSubmitted() && !!editorErrors()['displayName']"
                          />
                          @if (editorSubmitted() && editorErrors()['displayName']; as err) {
                            <span class="field-error">{{ err }}</span>
                          }
                        </div>

                        <div class="field-group">
                          <label for="ed-price" class="field-label">حداقل مبلغ حمایت (تومان)</label>
                          <input
                            id="ed-price"
                            type="number"
                            min="10000"
                            max="50000000"
                            step="5000"
                            formControlName="minSupportAmount"
                            class="field-input tabular-nums"
                            [class.is-invalid]="editorSubmitted() && !!editorErrors()['minSupportAmount']"
                          />
                          @if (editorSubmitted() && editorErrors()['minSupportAmount']; as err) {
                            <span class="field-error">{{ err }}</span>
                          }
                        </div>
                      </div>

                      <div class="two-cols">
                        <div class="field-group">
                          <label for="ed-category" class="field-label">دسته‌بندی</label>
                          <select id="ed-category" formControlName="category" class="field-select">
                            @for (cat of categories; track cat.key) {
                              <option [value]="cat.key">{{ cat.label }}</option>
                            }
                          </select>
                        </div>

                        <div class="field-group">
                          <label for="ed-cover" class="field-label">تصویر کاور</label>
                          <select id="ed-cover" formControlName="coverUrl" class="field-select">
                            @for (cov of coverOptions; track cov.url) {
                              <option [value]="cov.url">{{ cov.label }}</option>
                            }
                          </select>
                        </div>
                      </div>

                      <div class="field-group">
                        <label for="ed-tagline" class="field-label">معرفی یک‌خطی</label>
                        <input id="ed-tagline" type="text" formControlName="tagline" class="field-input" />
                      </div>

                      <div class="field-group">
                        <label for="ed-bio" class="field-label">درباره من</label>
                        <textarea id="ed-bio" formControlName="bio" class="field-textarea"></textarea>
                      </div>

                      @if (editorSaved()) {
                        <div class="status-banner is-success" role="status">
                          <app-icon name="check" [size]="18" />
                          <span>تغییرات صفحه با موفقیت ذخیره شد.</span>
                        </div>
                      }

                      <div class="form-actions">
                        <button type="submit" class="btn btn-primary">ذخیره تغییرات</button>
                        <a [routerLink]="['/c', activeCreator()!.username]" class="btn btn-secondary">
                          پیش‌نمایش صفحه عمومی
                        </a>
                      </div>
                    </form>
                  </div>
                }

                @case ('animations') {
                  <header class="dash-head-row">
                    <div>
                      <h1 class="dash-title">انیمیشن‌های تشکر ویژه حامیان</h1>
                      <p class="dash-subtitle">
                        جلوه‌های ویژه خریداری کنید تا پس از پرداخت حامی، پیام قدردانی شما با شکوه بیشتری نمایش داده شود
                      </p>
                    </div>
                    <span class="anim-active-tag tabular-nums">
                      موجودی قابل تسویه: {{ formatToman(availableBalance()) }}
                    </span>
                  </header>

                  <div class="surface-card form-card">
                    <h2 class="card-title">پیام تشکر اختصاصی پس از پرداخت</h2>
                    <p class="card-desc">
                      این متن داخل پنجره انیمیشن تشکر برای حامیان صفحه شما نمایش داده می‌شود.
                    </p>
                    <form [formGroup]="thankYouNoteForm" (ngSubmit)="saveThankYouNote()" novalidate class="dash-form">
                      <div class="field-group">
                        <label for="ty-note-input" class="field-label">متن قدردانی دلخواه (حداکثر ۲۲۰ کاراکتر)</label>
                        <textarea
                          id="ty-note-input"
                          formControlName="note"
                          class="field-textarea"
                          placeholder="مثلاً: بی‌نهایت ممنون از حمایتت! با این همراهی بخش تازه‌ای از پروژه را پیش می‌بریم..."
                        ></textarea>
                        @if (thankYouNoteError(); as err) {
                          <span class="field-error">
                            <app-icon name="alert" [size]="14" />
                            <span>{{ err }}</span>
                          </span>
                        }
                      </div>

                      @if (thankYouNoteSaved()) {
                        <div class="status-banner is-success" role="status">
                          <app-icon name="check" [size]="18" />
                          <span>پیام تشکر اختصاصی با موفقیت ذخیره شد.</span>
                        </div>
                      }

                      <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                          <app-icon name="check" [size]="16" />
                          <span>ذخیره پیام تشکر</span>
                        </button>
                        <button
                          type="button"
                          class="btn btn-secondary"
                          (click)="openAnimationPreview(creatorAnimConfig().activeId)"
                        >
                          <app-icon name="play" [size]="15" />
                          <span>پیش‌نمایش جلوه فعال فعلی ({{ activeAnimPack().name }})</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  @if (animActionBanner(); as banner) {
                    <div class="status-banner is-success" role="status">
                      <app-icon name="sparkles" [size]="18" />
                      <span>{{ banner }}</span>
                    </div>
                  }

                  <div class="surface-card form-card">
                    <div class="card-head-row">
                      <div>
                        <h2 class="card-title">فروشگاه جلوه‌های تشکر دونو</h2>
                        <p class="card-desc">هر انیمیشن را ابتدا به صورت زنده پیش‌نمایش ببینید، خریداری و روی صفحه فعال کنید.</p>
                      </div>
                    </div>

                    <div class="anim-grid">
                      @for (pack of animationCatalog; track pack.id) {
                        @let owned = isAnimOwned(pack.id);
                        @let active = creatorAnimConfig().activeId === pack.id;
                        <article
                          class="anim-card"
                          [class.is-active]="active"
                          [class.is-standard-card]="!pack.isPremium"
                        >
                          <div class="anim-card-stage" [attr.data-anim]="pack.id">
                            <span class="anim-stage-badge">{{ pack.badgeLabel }}</span>
                            <span class="anim-stage-price tabular-nums" [class.is-free]="!pack.isPremium">
                              {{ pack.isPremium ? formatToman(pack.priceToman) : 'رایگان' }}
                            </span>
                            <div class="anim-stage-icon">
                              <app-icon [name]="animIconName(pack.id)" [size]="26" />
                            </div>
                          </div>

                          <div class="anim-card-body">
                            <h3 class="anim-card-title">{{ pack.name }}</h3>
                            <p class="anim-card-sub">{{ pack.subtitle }}</p>
                            <p class="anim-card-desc">{{ pack.description }}</p>

                            <div class="anim-card-actions">
                              <button
                                type="button"
                                class="btn btn-secondary btn-sm"
                                (click)="openAnimationPreview(pack.id)"
                              >
                                <app-icon name="play" [size]="14" />
                                <span>پیش‌نمایش زنده</span>
                              </button>

                              @if (active) {
                                <span class="anim-active-tag">
                                  <app-icon name="check" [size]="15" />
                                  <span>فعال روی صفحه شما</span>
                                </span>
                              } @else if (owned) {
                                <button
                                  type="button"
                                  class="btn btn-primary btn-sm"
                                  (click)="activateOwnedAnimation(pack.id)"
                                >
                                  <app-icon name="check" [size]="15" />
                                  <span>فعال‌سازی</span>
                                </button>
                              } @else {
                                <button
                                  type="button"
                                  class="btn btn-warm btn-sm"
                                  (click)="openPurchaseModal(pack)"
                                >
                                  <app-icon name="sparkles" [size]="15" />
                                  <span>خرید و فعال‌سازی</span>
                                </button>
                              }
                            </div>
                          </div>
                        </article>
                      }
                    </div>
                  </div>
                }

                @case ('settings') {
                  <header class="dash-head">
                    <h1 class="dash-title">تنظیمات حساب و ظاهر</h1>
                    <p class="dash-subtitle">مدیریت ترجیحات نمایشی و اعلان‌ها</p>
                  </header>

                  <div class="surface-card form-card settings-list">
                    <div class="setting-row">
                      <div>
                        <strong class="setting-title">حالت نمایش (روشن / تاریک)</strong>
                        <p class="setting-desc">تغییر تم رنگی رابط کاربری دونو</p>
                      </div>
                      <button type="button" class="btn btn-secondary btn-sm" (click)="themeService.toggle()">
                        @if (themeService.theme() === 'dark') {
                          <app-icon name="sun" [size]="16" />
                          <span>حالت روشن</span>
                        } @else {
                          <app-icon name="moon" [size]="16" />
                          <span>حالت تاریک</span>
                        }
                      </button>
                    </div>

                    <div class="setting-row">
                      <div>
                        <strong class="setting-title">ایمیل اعلان حمایت جدید</strong>
                        <p class="setting-desc">ارسال پیام اطلاع‌رسانی پس از هر حمایت به ایمیل حساب گوگل</p>
                      </div>
                      <label class="toggle-check">
                        <input
                          type="checkbox"
                          [checked]="notifyEmail()"
                          (change)="notifyEmail.set(!notifyEmail())"
                        />
                        <span>{{ notifyEmail() ? 'فعال' : 'غیرفعال' }}</span>
                      </label>
                    </div>

                    <div class="setting-row">
                      <div>
                        <strong class="setting-title">خروج از حساب کاربری</strong>
                        <p class="setting-desc">{{ authService.currentUser()?.email || 'حساب نمونه سارا محمدی' }}</p>
                      </div>
                      <button type="button" class="btn btn-secondary btn-sm" (click)="logout()">
                        <app-icon name="logout" [size]="16" />
                        <span>خروج</span>
                      </button>
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <app-share-modal
            [open]="shareModalOpen()"
            [username]="activeCreator()!.username"
            [displayName]="activeCreator()!.displayName"
            (closed)="shareModalOpen.set(false)"
          />

          <app-thank-you-celebration
            [open]="previewOpen()"
            [animationId]="previewAnimId()"
            [creatorName]="activeCreator()!.displayName"
            [creatorAvatarUrl]="activeCreator()!.avatarUrl"
            [creatorVerified]="activeCreator()!.verified"
            supporterName="امیرحسین راد (حامی نمونه)"
            [amount]="250000"
            postTitle="حمایت از تولید محتوای مستقل"
            [thankYouNote]="creatorAnimConfig().thankYouNote"
            [previewMode]="true"
            (closed)="previewOpen.set(false)"
          />

          @if (purchaseModalPack(); as buyPack) {
            <div class="anim-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="anim-buy-title">
              <div class="surface-card anim-modal-card">
                <div class="chart-head" style="margin-block-end: 0;">
                  <h2 id="anim-buy-title" class="card-title">خرید انیمیشن «{{ buyPack.name }}»</h2>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    aria-label="بستن"
                    (click)="purchaseModalPack.set(null)"
                  >
                    <app-icon name="close" [size]="18" />
                  </button>
                </div>

                <p class="card-desc">
                  مبلغ: <strong class="tabular-nums">{{ formatToman(buyPack.priceToman) }}</strong> (پرداخت یک‌بار برای استفاده همیشگی)
                </p>

                <div class="anim-pay-methods">
                  <button
                    type="button"
                    class="anim-pay-opt"
                    [class.is-selected]="purchaseMethod() === 'balance'"
                    [disabled]="availableBalance() < buyPack.priceToman"
                    (click)="purchaseMethod.set('balance')"
                  >
                    <app-icon name="wallet" [size]="20" />
                    <div class="anim-pay-opt-text">
                      <strong>کسر از موجودی قابل تسویه</strong>
                      <span class="tabular-nums">
                        @if (availableBalance() >= buyPack.priceToman) {
                          موجودی فعلی شما: {{ formatToman(availableBalance()) }}
                        } @else {
                          موجودی کافی نیست (موجودی فعلی: {{ formatToman(availableBalance()) }})
                        }
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    class="anim-pay-opt"
                    [class.is-selected]="purchaseMethod() === 'direct'"
                    (click)="purchaseMethod.set('direct')"
                  >
                    <app-icon name="sparkles" [size]="20" />
                    <div class="anim-pay-opt-text">
                      <strong>پرداخت آنلاین آزمایشی (بدون کسر از موجودی)</strong>
                      <span>مناسب برای تست سریع یا زمانی که موجودی تسویه کافی نیست</span>
                    </div>
                  </button>
                </div>

                @if (purchaseError(); as pErr) {
                  <span class="field-error">
                    <app-icon name="alert" [size]="14" />
                    <span>{{ pErr }}</span>
                  </span>
                }

                <div class="form-actions">
                  <button type="button" class="btn btn-warm" (click)="confirmAnimationPurchase()">
                    <app-icon name="check" [size]="17" />
                    <span>تایید خرید و فعال‌سازی</span>
                  </button>
                  <button type="button" class="btn btn-secondary" (click)="purchaseModalPack.set(null)">
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: `
    .dashboard-section {
      padding-block: 2rem;
    }

    .auth-gate {
      max-inline-size: 520px;
      margin-inline: auto;
      padding: 2.5rem 1.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.9rem;
    }

    .auth-gate h1,
    .auth-gate p {
      margin: 0;
    }

    .auth-gate p {
      color: var(--text-secondary);
    }

    .gate-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin-block-start: 0.5rem;
    }

    .dashboard-shell {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    @media (min-width: 960px) {
      .dashboard-shell {
        grid-template-columns: 260px 1fr;
        gap: 2rem;
      }
      .dash-sidebar {
        position: sticky;
        inset-block-start: 84px;
      }
    }

    .dash-sidebar {
      padding: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sidebar-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-block-end: 0.9rem;
      border-block-end: 1px solid var(--border-subtle);
    }

    .sidebar-avatar {
      inline-size: 46px;
      block-size: 46px;
      border-radius: 12px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .sidebar-meta {
      display: flex;
      flex-direction: column;
      min-inline-size: 0;
    }

    .sidebar-meta strong {
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar-meta span {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .dash-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    @media (min-width: 960px) {
      .dash-nav {
        flex-direction: column;
      }
    }

    .dash-nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      min-block-size: 42px;
      padding-inline: 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 600;
      text-align: start;
      cursor: pointer;
      white-space: nowrap;
      transition:
        background-color var(--transition-fast),
        color var(--transition-fast),
        transform var(--transition-fast);
    }

    .dash-nav-btn:hover {
      background-color: var(--bg-subtle);
      color: var(--text-primary);
      transform: translateX(-2px);
    }

    .dash-nav-btn:active {
      transform: scale(0.98);
    }

    .dash-nav-btn.is-active {
      background-color: var(--accent);
      color: var(--accent-text);
      font-weight: 700;
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .full-w {
      width: 100%;
    }

    .dash-main {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      min-inline-size: 0;
    }

    .dash-head {
      margin-block-end: 0.25rem;
    }

    .dash-head-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.85rem;
      margin-block-end: 0.25rem;
    }

    .dash-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
    }

    .dash-subtitle {
      margin: 0.3rem 0 0;
      color: var(--text-secondary);
      font-size: 0.9375rem;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 640px) {
      .kpi-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .kpi-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      animation: dastFadeSlideUp 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .kpi-card:nth-child(2) { animation-delay: 60ms; }
    .kpi-card:nth-child(3) { animation-delay: 120ms; }

    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent-border);
    }

    .kpi-card-warm {
      border-block-start: 3px solid var(--secondary-accent);
    }

    .kpi-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .kpi-value {
      font-size: 1.35rem;
      font-weight: 800;
    }

    .kpi-value-warm {
      color: var(--secondary-accent-ink);
    }

    .chart-card,
    .recent-card,
    .form-card {
      padding: 1.35rem;
    }

    .chart-head,
    .card-head-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-block-end: 1.25rem;
    }

    .card-title {
      margin: 0;
      font-size: 1.075rem;
      font-weight: 700;
    }

    .card-desc {
      margin: 0.2rem 0 0;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .chart-unit {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .bar-chart {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.75rem;
      align-items: end;
      block-size: 210px;
      padding-block-start: 1rem;
    }

    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      height: 100%;
    }

    .bar-amount {
      font-size: 0.75rem;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .bar-track {
      flex: 1;
      width: 100%;
      max-inline-size: 46px;
      background-color: var(--bg-subtle);
      border-radius: 10px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }

    .bar-fill {
      width: 100%;
      background-color: var(--accent);
      border-radius: 8px 8px 0 0;
      min-block-size: 10%;
      transform-origin: bottom;
      animation: barScaleRise 580ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--bar-idx, 0) * 65ms);
      transition:
        block-size 260ms cubic-bezier(0.16, 1, 0.3, 1),
        filter var(--transition-fast);
    }

    .bar-col:hover .bar-fill {
      filter: brightness(1.08);
    }

    .bar-col:last-child .bar-fill {
      background-color: var(--secondary-accent);
    }

    @keyframes barScaleRise {
      from {
        transform: scaleY(0);
      }
      to {
        transform: scaleY(1);
      }
    }

    .bar-month {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .link-btn {
      background: transparent;
      border: 0;
      padding: 0;
      color: var(--secondary-accent-ink);
      font-weight: 700;
      font-size: 0.875rem;
      text-decoration: underline;
      cursor: pointer;
    }

    .table-card {
      overflow: hidden;
    }

    .table-title {
      padding: 1.25rem 1.25rem 0.5rem;
    }

    .table-toolbar {
      padding: 1rem 1.25rem;
      border-block-end: 1px solid var(--border-subtle);
    }

    .table-wrap {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .data-table th,
    .data-table td {
      padding: 0.75rem 1.15rem;
      text-align: start;
      border-block-end: 1px solid var(--border-subtle);
    }

    .data-table th {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      background-color: var(--bg-canvas);
      white-space: nowrap;
    }

    .data-table tbody tr:last-child td {
      border-block-end: 0;
    }

    .fw-600 {
      font-weight: 600;
      white-space: nowrap;
    }

    .msg-cell {
      max-inline-size: 320px;
      color: var(--text-secondary);
    }

    .nowrap {
      white-space: nowrap;
    }

    .status-text {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.825rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .status-text.is-paid {
      color: var(--success-text);
    }

    .status-text.is-pending {
      color: var(--warning-text);
    }

    .dash-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-block-start: 1rem;
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

    .form-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
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

    .settings-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .setting-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-block-end: 1.25rem;
      border-block-end: 1px solid var(--border-subtle);
    }

    .setting-row:last-child {
      padding-block-end: 0;
      border-block-end: 0;
    }

    .setting-title {
      display: block;
      font-size: 0.975rem;
      font-weight: 700;
    }

    .setting-desc {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .toggle-check {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      cursor: pointer;
    }

    .toggle-check input {
      inline-size: 18px;
      block-size: 18px;
      accent-color: var(--accent-hover);
    }

    .empty-inner {
      padding: 2.5rem 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
    }

    .empty-inner p {
      margin: 0;
    }

    .empty-inline {
      margin: 0;
      color: var(--text-muted);
    }

    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
  `,
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);
  protected readonly creatorService = inject(CreatorService);
  protected readonly supportService = inject(SupportService);
  protected readonly animationStore = inject(AnimationStoreService);
  protected readonly themeService = inject(ThemeService);
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

  protected readonly categories: Array<{ key: CreatorCategory; label: string }> = (
    Object.keys(CATEGORY_LABELS) as CreatorCategory[]
  ).map((key) => ({ key, label: CATEGORY_LABELS[key] }));

  protected readonly coverOptions = [
    { url: COVER_CREATIVE_URL, label: 'میز کار هنری و طراحی' },
    { url: COVER_PODCAST_URL, label: 'استودیو پادکست و فناوری' },
    { url: HERO_IMAGE_URL, label: 'فضای استودیو روشن' },
  ];

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
    coverUrl: new FormControl<string>(COVER_CREATIVE_URL, { nonNullable: true }),
    tagline: new FormControl<string>('', { nonNullable: true }),
    bio: new FormControl<string>('', { nonNullable: true }),
  });
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

  constructor() {
    this.supporterSearch.valueChanges.subscribe((v) => this.supporterQuery.set(v));
    this.postForm.controls.kind.valueChanges.subscribe((k) => this.postKind.set(k));
    this.postForm.controls.targetAmount.valueChanges.subscribe((v) =>
      this.postTargetAmount.set(Number(v) || 0),
    );

    effect(() => {
      const c = this.activeCreator();
      if (c) {
        this.editorForm.patchValue(
          {
            displayName: c.displayName,
            minSupportAmount: c.minSupportAmount,
            category: c.category,
            coverUrl: c.coverUrl,
            tagline: c.tagline,
            bio: c.bio,
          },
          { emitEvent: false },
        );
        const animCfg = this.animationStore.getCreatorConfig(c.username);
        this.thankYouNoteForm.patchValue({ note: animCfg.thankYouNote }, { emitEvent: false });
      }
    });
  }

  protected async enterDemoCreator(): Promise<void> {
    await this.authService.signInWithGoogle(true);
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

  protected async submitPayout(): Promise<void> {
    const c = this.activeCreator();
    if (!c) return;
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
    this.payoutForm.patchValue({ sheba: '' });
  }

  protected saveProfile(): void {
    const c = this.activeCreator();
    if (!c) return;
    this.editorSubmitted.set(true);
    this.editorSaved.set(false);
    const val = this.editorForm.getRawValue();
    const errs: Record<string, string> = {};

    if (val.displayName.trim().length < 3) {
      errs['displayName'] = 'نام نمایشی باید حداقل ۳ کاراکتر باشد.';
    }
    if (!Number.isFinite(val.minSupportAmount) || val.minSupportAmount < MIN_SUPPORT_TOMAN) {
      errs['minSupportAmount'] = `حداقل مبلغ حمایت ${formatToman(MIN_SUPPORT_TOMAN)} است.`;
    } else if (val.minSupportAmount > MAX_SUPPORT_TOMAN) {
      errs['minSupportAmount'] = `حداکثر مبلغ مجاز ${formatToman(MAX_SUPPORT_TOMAN)} است.`;
    }

    this.editorErrors.set(errs);
    if (Object.keys(errs).length > 0) return;

    this.creatorService.updateCreatorProfile(c.username, {
      displayName: val.displayName.trim(),
      minSupportAmount: Number(val.minSupportAmount),
      category: val.category,
      coverUrl: val.coverUrl,
      tagline: val.tagline.trim(),
      bio: val.bio.trim(),
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
