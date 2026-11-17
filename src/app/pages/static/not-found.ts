import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '../../components/icon/icon';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon],
  template: `
    <section class="not-found-section">
      <div class="container not-found-wrap">
        <div class="surface-card not-found-card">
          <span class="code-num tabular-nums">۴۰۴</span>
          <h1 class="not-found-title">صفحه مورد نظر پیدا نشد</h1>
          <p class="not-found-desc">
            ممکن است آدرس را اشتباه وارد کرده باشید یا این صفحه جابه‌جا شده باشد.
          </p>
          <div class="not-found-actions">
            <a routerLink="/" class="btn btn-primary">بازگشت به صفحه اصلی</a>
            <a routerLink="/explore" class="btn btn-secondary">
              <span>کاوش آفرینندگان</span>
              <app-icon name="arrow-left" [size]="16" />
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .not-found-section {
      padding-block: 4rem 3rem;
    }
    .not-found-wrap {
      display: flex;
      justify-content: center;
    }
    .not-found-card {
      max-inline-size: 500px;
      width: 100%;
      padding: 2.5rem 1.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.9rem;
    }
    .code-num {
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1;
      color: var(--secondary-accent);
    }
    .not-found-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 800;
    }
    .not-found-desc {
      margin: 0;
      color: var(--text-secondary);
    }
    .not-found-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin-block-start: 0.5rem;
    }
  `,
})
export class NotFoundComponent {}
