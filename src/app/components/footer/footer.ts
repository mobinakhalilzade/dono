import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '../icon/icon';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon],
  template: `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand-col">
          <a routerLink="/" class="footer-brand">
            <span class="footer-brand-mark" aria-hidden="true">
              <app-icon name="brand" [size]="18" />
            </span>
            <span>دونو</span>
          </a>
          <p class="footer-desc">
            بستر ساده و شفاف برای حمایت مالی مستقیم از پادکست‌سازان، نویسندگان، هنرمندان و توسعه‌دهندگان مستقل فارسی‌زبان.
          </p>
        </div>

        <div class="footer-col">
          <h3 class="footer-heading">پلتفرم</h3>
          <ul class="footer-links">
            <li><a routerLink="/explore">کاوش آفرینندگان</a></li>
            <li><a routerLink="/login">ساخت صفحه حمایت</a></li>
            <li><a routerLink="/dashboard">داشبورد آفریننده</a></li>
            <li><a routerLink="/faq">سوالات متداول</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h3 class="footer-heading">دونو</h3>
          <ul class="footer-links">
            <li><a routerLink="/about">درباره ما</a></li>
            <li><a routerLink="/contact">تماس با ما</a></li>
            <li><a routerLink="/terms">قوانین و مقررات</a></li>
            <li><a routerLink="/privacy">حریم خصوصی</a></li>
          </ul>
        </div>
      </div>

      <div class="container footer-bottom">
        <p>© ۱۴۰۵ دونو — ساخته شده با عشق برای جامعه آفرینندگان فارسی</p>
      </div>
    </footer>
  `,
  styles: `
    .site-footer {
      border-block-start: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      padding-block-start: 3rem;
      padding-block-end: 2rem;
      margin-block-start: 4rem;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 768px) {
      .footer-grid {
        grid-template-columns: 1.5fr 1fr 1fr;
      }
    }

    .footer-brand {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.15rem;
      font-weight: 800;
      margin-block-end: 0.75rem;
    }

    .footer-brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 30px;
      block-size: 30px;
      border-radius: 8px;
      background-color: var(--accent);
      color: var(--accent-text);
    }

    .footer-desc {
      margin: 0;
      max-inline-size: 38ch;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .footer-heading {
      margin: 0 0 0.75rem;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .footer-links a:hover {
      color: var(--secondary-accent-ink);
      text-decoration: underline;
      text-underline-offset: 4px;
    }

    .footer-bottom {
      margin-block-start: 2.5rem;
      padding-block-start: 1.25rem;
      border-block-start: 1px solid var(--border-subtle);
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .footer-bottom p {
      margin: 0;
    }
  `,
})
export class Footer {}
