import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { CreatorCard } from '../../components/creator-card/creator-card';
import { AppIcon } from '../../components/icon/icon';
import { CreatorCategory } from '../../models/dono.models';
import { ActivityCategoriesService } from '../../services/activity-categories.service';
import { CreatorService } from '../../services/creator.service';
import { formatNumberFa } from '../../utils/formatters';

@Component({
  selector: 'app-explore',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, CreatorCard, AppIcon],
  templateUrl: './explore.html',
  styleUrl: './explore.scss',
})
export class ExploreComponent {
  private readonly creatorService = inject(CreatorService);
  private readonly activityCategoriesService = inject(ActivityCategoriesService);

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

  protected readonly categoryEntries = this.activityCategoriesService.categories;

  constructor() {
    void this.activityCategoriesService.loadCategories();
  }

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
