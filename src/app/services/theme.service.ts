import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'dono_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly theme = signal<ThemeMode>('light');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      this.theme.set(hasDarkClass ? 'dark' : 'light');
    }
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.toggle('dark', mode === 'dark');
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // Ignore storage restrictions
      }
    }
  }
}
