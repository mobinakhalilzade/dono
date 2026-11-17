import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  inject,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, skip } from 'rxjs';
import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Navbar, Footer],
  template: `
    <div class="app-shell">
      <app-navbar />
      <main #mainContainer class="app-main">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
  styles: `
    .app-shell {
      min-block-size: 100dvh;
      display: flex;
      flex-direction: column;
    }
    .app-main {
      flex: 1;
    }
  `,
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly mainContainer = viewChild<ElementRef<HTMLElement>>('mainContainer');

  constructor() {
    void this.authService.initSession();

    if (isPlatformBrowser(this.platformId)) {
      this.router.events
        .pipe(
          filter((event): event is NavigationEnd => event instanceof NavigationEnd),
          skip(1),
          takeUntilDestroyed(),
        )
        .subscribe(() => {
          const el = this.mainContainer()?.nativeElement;
          if (!el || typeof el.animate !== 'function') return;
          if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

          el.animate(
            [
              { opacity: 0.35, transform: 'translateY(10px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            {
              duration: 260,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
          );
        });
    }
  }
}
