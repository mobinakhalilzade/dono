import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { AppIcon } from '../icon/icon';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, AppIcon],
  template: `
    <header class="site-header">
      <div class="container header-inner">
        <a routerLink="/" class="brand-link" (click)="closeMenu()">
          <span class="brand-mark" aria-hidden="true">
            <app-icon name="brand" [size]="20" />
          </span>
          <span class="brand-name">دونو</span>
        </a>

        <nav class="desktop-nav" aria-label="ناوبری اصلی">
          <a
            routerLink="/"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link"
          >
            صفحه اصلی
          </a>
          <a routerLink="/explore" routerLinkActive="is-active" class="nav-link">
            کاوش آفرینندگان
          </a>
          <a routerLink="/about" routerLinkActive="is-active" class="nav-link">
            درباره ما
          </a>
          <a routerLink="/faq" routerLinkActive="is-active" class="nav-link">
            سوالات متداول
          </a>
        </nav>

        <div class="header-actions">
          <button
            type="button"
            class="theme-btn"
            (click)="themeService.toggle()"
            [attr.aria-label]="
              themeService.theme() === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'
            "
          >
            @if (themeService.theme() === 'dark') {
              <app-icon name="sun" [size]="18" />
            } @else {
              <app-icon name="moon" [size]="18" />
            }
          </button>

          @if (authService.currentUser(); as user) {
            <a
              [routerLink]="user.onboarded ? '/dashboard' : '/onboarding'"
              class="btn btn-primary btn-sm header-cta"
            >
              {{ user.onboarded ? 'داشبورد من' : 'تکمیل پروفایل' }}
            </a>
          } @else {
            <a routerLink="/login" class="btn btn-primary btn-sm header-cta">
              شروع رایگان
            </a>
          }

          <button
            type="button"
            class="mobile-menu-btn"
            (click)="mobileOpen.set(!mobileOpen())"
            [attr.aria-expanded]="mobileOpen()"
            aria-label="باز کردن منو"
          >
            @if (mobileOpen()) {
              <app-icon name="close" [size]="20" />
            } @else {
              <app-icon name="menu" [size]="20" />
            }
          </button>
        </div>
      </div>

      @if (mobileOpen()) {
        <nav class="mobile-drawer" aria-label="منوی موبایل">
          <div class="container mobile-drawer-inner">
            <a routerLink="/" class="mobile-link" (click)="closeMenu()">صفحه اصلی</a>
            <a routerLink="/explore" class="mobile-link" (click)="closeMenu()">کاوش آفرینندگان</a>
            <a routerLink="/about" class="mobile-link" (click)="closeMenu()">درباره ما</a>
            <a routerLink="/faq" class="mobile-link" (click)="closeMenu()">سوالات متداول</a>
            <a routerLink="/contact" class="mobile-link" (click)="closeMenu()">تماس با ما</a>
          </div>
        </nav>
      }
    </header>
  `,
  styles: `
    .site-header {
      position: sticky;
      inset-block-start: 0;
      z-index: 40;
      background-color: color-mix(in srgb, var(--bg-canvas) 88%, transparent);
      border-block-end: 1px solid var(--border-subtle);
      backdrop-filter: blur(10px);
    }

    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      min-block-size: 64px;
    }

    @media (min-width: 768px) {
      .header-inner {
        gap: 2rem;
      }
    }

    .brand-link {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 34px;
      block-size: 34px;
      border-radius: 10px;
      background-color: var(--accent);
      color: var(--accent-text);
      transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .brand-link:hover .brand-mark {
      transform: scale(1.07) rotate(-4deg);
    }

    .brand-name {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .desktop-nav {
      display: none;
      align-items: center;
      gap: 1.5rem;
    }

    .nav-link {
      position: relative;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-secondary);
      white-space: nowrap;
      flex-shrink: 0;
      padding-block: 0.35rem;
      transition: color var(--transition-fast);
    }

    .nav-link::after {
      content: '';
      position: absolute;
      inset-inline: 0;
      inset-block-end: 0;
      block-size: 2px;
      border-radius: 2px;
      background-color: var(--secondary-accent);
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .nav-link:hover,
    .nav-link.is-active {
      color: var(--text-primary);
    }

    .nav-link:hover::after {
      transform: scaleX(0.45);
    }

    .nav-link.is-active {
      font-weight: 700;
    }

    .nav-link.is-active::after {
      transform: scaleX(1);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex-shrink: 0;
    }

    .theme-btn,
    .mobile-menu-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 40px;
      block-size: 40px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      color: var(--text-primary);
      cursor: pointer;
      transition:
        background-color var(--transition-fast),
        border-color var(--transition-fast),
        color var(--transition-fast),
        transform var(--transition-fast);
    }

    .theme-btn app-icon {
      transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .theme-btn:hover app-icon {
      transform: rotate(-16deg) scale(1.08);
    }

    .theme-btn:active,
    .mobile-menu-btn:active {
      transform: scale(0.94);
    }

    .theme-btn:hover,
    .mobile-menu-btn:hover {
      background-color: var(--bg-subtle);
      border-color: var(--secondary-accent-border);
      color: var(--secondary-accent-ink);
    }

    .mobile-drawer {
      border-block-start: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      padding-block: 0.75rem;
      animation: drawerDrop 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes drawerDrop {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .mobile-drawer-inner {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .mobile-link {
      display: block;
      padding-block: 0.65rem;
      padding-inline: 0.5rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-primary);
      border-radius: var(--radius-sm);
    }

    .mobile-link:hover {
      background-color: var(--bg-subtle);
    }

    @media (min-width: 768px) {
      .desktop-nav {
        display: flex;
      }
      .mobile-menu-btn,
      .mobile-drawer {
        display: none;
      }
    }
  `,
})
export class Navbar {
  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);
  protected readonly mobileOpen = signal(false);

  protected closeMenu(): void {
    this.mobileOpen.set(false);
  }
}
