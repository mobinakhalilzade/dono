import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import {
  ActivityCategoryOption,
  DEFAULT_ACTIVITY_CATEGORIES,
  parseActivityCategoriesResponse,
  resolveCategoryLabel,
} from '../utils/activity-categories';

const ACTIVITIES_CATEGORIES_PATH = '/activities-categories';

@Injectable({ providedIn: 'root' })
export class ActivityCategoriesService {
  private readonly platformId = inject(PLATFORM_ID);
  private inFlight: Promise<ActivityCategoryOption[]> | null = null;

  readonly categories = signal<readonly ActivityCategoryOption[]>(DEFAULT_ACTIVITY_CATEGORIES);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly loadedFromApi = signal(false);

  async loadCategories(force = false): Promise<readonly ActivityCategoryOption[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return this.categories();
    }
    if (this.loadedFromApi() && !force) {
      return this.categories();
    }
    if (this.inFlight && !force) {
      return this.inFlight;
    }

    const request = (async (): Promise<ActivityCategoryOption[]> => {
      this.loading.set(true);
      this.error.set(null);
      try {
        const res = await fetch(`${environment.directusUrl}${ACTIVITIES_CATEGORIES_PATH}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const payload = (await res.json()) as unknown;
        const parsed = parseActivityCategoriesResponse(payload);
        if (parsed.length === 0) {
          throw new Error('Empty categories payload');
        }
        this.categories.set(parsed);
        this.loadedFromApi.set(true);
        return parsed;
      } catch {
        this.error.set('دریافت دسته‌بندی‌ها از سرور انجام نشد؛ گزینه‌های پیش‌فرض نمایش داده می‌شوند.');
        return [...this.categories()];
      } finally {
        this.loading.set(false);
        this.inFlight = null;
      }
    })();

    this.inFlight = request;
    return request;
  }

  getLabel(key: string | undefined | null): string {
    return resolveCategoryLabel(key, this.categories());
  }
}
