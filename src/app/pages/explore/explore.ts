import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { CreatorCard } from '../../components/creator-card/creator-card';
import { AppIcon } from '../../components/icon/icon';
import { CATEGORY_LABELS, CreatorCategory } from '../../models/dono.models';
import { CreatorService } from '../../services/creator.service';
import { formatNumberFa } from '../../utils/formatters';

@Component({
  selector: 'app-explore',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CreatorCard, AppIcon],
  template: `
    <section class="explore-section">
      <div class="container">
        <header class="page-head">
          <h1 class="page-title balance-text">کاوش آفرینندگان دونو</h1>
          <p class="page-subtitle">
            پادکست‌سازان، تصویرگران، نویسندگان و برنامه‌نویسان مستقل فارسی را پیدا و حمایت کنید.
          </p>
        </header>

        <div class="controls-bar surface-card">
          <div class="search-field-wrap">
            <label for="explore-search" class="sr-only">جست‌وجوی آفریننده</label>
            <span class="search-icon" aria-hidden="true">
              <app-icon name="search" [size]="18" />
            </span>
            <input
              id="explore-search"
              type="search"
              [formControl]="searchControl"
              class="field-input search-input"
              placeholder="جست‌وجو بر اساس نام، نام کاربری یا موضوع..."
            />
          </div>

          <div class="sort-wrap">
            <label for="explore-sort" class="sort-label">مرتب‌سازی:</label>
            <select
              id="explore-sort"
              [formControl]="sortControl"
              class="field-select sort-select"
              (change)="triggerBriefLoading()"
            >
              <option value="popular">پرحامی‌ترین</option>
              <option value="newest">جدیدترین</option>
              <option value="raised">بیشترین حمایت دریافتی</option>
            </select>
          </div>
        </div>

        <div class="categories-bar" role="tablist" aria-label="فیلتر دسته‌بندی آفرینندگان">
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="selectedCategory() === 'all'"
            class="cat-tab"
            [class.is-active]="selectedCategory() === 'all'"
            (click)="selectCategory('all')"
          >
            همه
          </button>
          @for (cat of categoryEntries; track cat.key) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="selectedCategory() === cat.key"
              class="cat-tab"
              [class.is-active]="selectedCategory() === cat.key"
              (click)="selectCategory(cat.key)"
            >
              {{ cat.label }}
            </button>
          }
        </div>

        <div class="results-meta meta-row">
          <span class="results-count tabular-nums">{{ formatNumberFa(filteredCreators().length) }} آفریننده</span>
          @if (selectedCategory() !== 'all' || (searchValue() ?? '').trim()) {
            <span aria-hidden="true">·</span>
            <button type="button" class="clear-inline-btn" (click)="resetFilters()">
              پاک کردن فیلترها
            </button>
          }
        </div>

        @if (isLoading()) {
          <div class="creators-grid" aria-busy="true" aria-label="در حال بارگذاری آفرینندگان">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="surface-card skeleton-card">
                <div class="skeleton skeleton-cover"></div>
                <div class="skeleton-body">
                  <div class="skeleton skeleton-line-lg"></div>
                  <div class="skeleton skeleton-line-sm"></div>
                  <div class="skeleton skeleton-line-md"></div>
                </div>
              </div>
            }
          </div>
        } @else if (filteredCreators().length > 0) {
          <div class="creators-grid">
            @for (creator of filteredCreators(); track creator.id; let i = $index) {
              <div class="creator-grid-item" [style.--stagger]="i < 6 ? i : 5">
                <app-creator-card [creator]="creator" />
              </div>
            }
          </div>
        } @else {
          <div class="surface-card empty-state">
            <app-icon name="search" [size]="32" />
            <h2 class="empty-title">آفریننده‌ای با این مشخصات پیدا نشد</h2>
            <p class="empty-desc">
              عبارت جست‌وجو یا دسته‌بندی انتخاب‌شده را تغییر دهید تا صفحه‌های فعال نمایش داده شوند.
            </p>
            <button type="button" class="btn btn-primary btn-sm" (click)="resetFilters()">
              نمایش همه آفرینندگان
            </button>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .explore-section {
      padding-block: 2.5rem 2rem;
    }

    .page-head {
      margin-block-end: 1.75rem;
    }

    .page-title {
      margin: 0;
      font-size: clamp(1.65rem, 3vw, 2.35rem);
      font-weight: 800;
    }

    .page-subtitle {
      margin: 0.45rem 0 0;
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .controls-bar {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    @media (min-width: 768px) {
      .controls-bar {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .search-field-wrap {
      position: relative;
      flex: 1;
    }

    .search-icon {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: 0.85rem;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      padding-inline-start: 2.6rem;
    }

    .sort-wrap {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .sort-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .sort-select {
      min-inline-size: 170px;
    }

    .categories-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-start: 1rem;
    }

    .cat-tab {
      min-block-size: 38px;
      padding-block: 0.4rem;
      padding-inline: 0.95rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
      cursor: pointer;
      transition:
        background-color var(--transition-fast),
        color var(--transition-fast),
        border-color var(--transition-fast),
        transform var(--transition-fast);
    }

    .cat-tab:hover {
      background-color: var(--bg-subtle);
      border-color: var(--accent-border);
      color: var(--text-primary);
      transform: translateY(-1px);
    }

    .cat-tab:active {
      transform: scale(0.96);
    }

    .cat-tab.is-active {
      background-color: var(--accent);
      color: var(--accent-text);
      border-color: var(--accent-hover);
      font-weight: 700;
    }

    .results-meta {
      margin-block: 1.15rem;
    }

    .results-count {
      font-weight: 700;
      color: var(--secondary-accent-ink);
    }

    .clear-inline-btn {
      background: transparent;
      border: 0;
      padding: 0;
      color: var(--secondary-accent-ink);
      font-weight: 600;
      font-size: 0.8125rem;
      text-decoration: underline;
      cursor: pointer;
    }

    .creators-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }

    .creator-grid-item {
      display: flex;
      animation: dastFadeSlideUp 380ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: calc(var(--stagger, 0) * 55ms);
    }

    .creator-grid-item app-creator-card {
      width: 100%;
    }

    @media (min-width: 640px) {
      .creators-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .creators-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .skeleton-card {
      overflow: hidden;
    }

    .skeleton-cover {
      aspect-ratio: 16 / 9;
      border-radius: 0;
    }

    .skeleton-body {
      padding: 1.125rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .skeleton-line-lg {
      block-size: 20px;
      inline-size: 55%;
    }

    .skeleton-line-sm {
      block-size: 14px;
      inline-size: 38%;
    }

    .skeleton-line-md {
      block-size: 34px;
      inline-size: 92%;
    }

    .empty-state {
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.75rem;
      color: var(--text-secondary);
    }

    .empty-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .empty-desc {
      margin: 0;
      max-inline-size: 42ch;
      font-size: 0.9375rem;
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
export class ExploreComponent {
  private readonly creatorService = inject(CreatorService);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly sortControl = new FormControl<'popular' | 'newest' | 'raised'>('popular', {
    nonNullable: true,
  });

  protected readonly searchValue = toSignal(
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)),
    { initialValue: '' },
  );

  protected readonly sortValue = toSignal(
    this.sortControl.valueChanges.pipe(startWith(this.sortControl.value)),
    { initialValue: 'popular' as const },
  );

  protected readonly selectedCategory = signal<CreatorCategory | 'all'>('all');
  protected readonly isLoading = signal(false);

  protected readonly categoryEntries: Array<{ key: CreatorCategory; label: string }> = (
    Object.keys(CATEGORY_LABELS) as CreatorCategory[]
  ).map((key) => ({ key, label: CATEGORY_LABELS[key] }));

  protected readonly filteredCreators = computed(() =>
    this.creatorService.filterCreators(
      this.searchValue() ?? '',
      this.selectedCategory(),
      this.sortValue() ?? 'popular',
    ),
  );

  protected readonly formatNumberFa = formatNumberFa;

  protected selectCategory(category: CreatorCategory | 'all'): void {
    this.selectedCategory.set(category);
    this.triggerBriefLoading();
  }

  protected resetFilters(): void {
    this.searchControl.setValue('');
    this.selectedCategory.set('all');
    this.sortControl.setValue('popular');
  }

  protected triggerBriefLoading(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 160);
  }
}
