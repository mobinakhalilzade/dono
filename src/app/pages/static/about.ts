import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '../../components/icon/icon';

@Component({
  selector: 'app-about',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon],
  template: `
    <article class="static-page">
      <div class="container static-narrow">
        <header class="static-head">
          <h1 class="static-title balance-text">درباره دونو</h1>
          <p class="static-lead">
            دونو کمک می‌کند آفرینندگان مستقل فارسی‌زبان بدون وابستگی به تبلیغات پراکنده، مستقیماً از سوی مخاطبانشان حمایت شوند.
          </p>
        </header>

        <div class="static-body surface-card">
          <section>
            <h2>چرا دونو ساخته شد؟</h2>
            <p>
              تولید پادکست باکیفیت، تصویرسازی، نوشتن خبرنامه تخصصی یا توسعه نرم‌افزار متن‌باز زمان و انرژی زیادی می‌طلبد. دونو راهی صمیمی و ساده ایجاد کرده تا هر مخاطبی بتواند با انتخاب مبلغ دلخواه خود به تومان، قدردانی خود را به صورت واقعی نشان دهد.
            </p>
          </section>

          <section>
            <h2>اصول ما</h2>
            <ul class="bullet-list">
              <li>شفافیت کامل در نمایش مبالغ به تومان و کارمزد ثابت ۵ درصدی</li>
              <li>عدم نیاز به ثبت‌نام پیچیده برای حامیان و امکان حمایت ناشناس</li>
              <li>احترام به حریم خصوصی و مالکیت کامل آفریننده بر مخاطبان و نوشته‌ها</li>
            </ul>
          </section>

          <div class="static-cta">
            <a routerLink="/login" class="btn btn-primary">
              <app-icon name="brand" [size]="18" />
              <span>ساخت صفحه رایگان</span>
            </a>
            <a routerLink="/explore" class="btn btn-secondary">کاوش آفرینندگان</a>
          </div>
        </div>
      </div>
    </article>
  `,
  styles: `
    .static-page {
      padding-block: 3rem 2rem;
    }
    .static-narrow {
      max-inline-size: 760px;
    }
    .static-head {
      margin-block-end: 1.75rem;
    }
    .static-title {
      margin: 0;
      font-size: clamp(1.75rem, 3vw, 2.4rem);
      font-weight: 800;
    }
    .static-lead {
      margin: 0.65rem 0 0;
      font-size: 1.0625rem;
      color: var(--text-secondary);
    }
    .static-body {
      padding: 1.75rem;
      border-block-start: 3px solid var(--accent);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .static-body h2 {
      margin: 0 0 0.55rem;
      font-size: 1.2rem;
      font-weight: 700;
    }
    .static-body p {
      margin: 0;
      color: var(--text-secondary);
    }
    .bullet-list {
      margin: 0;
      padding-inline-start: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      color: var(--text-secondary);
    }
    .bullet-list li::marker {
      color: var(--secondary-accent);
    }
    .static-cta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding-block-start: 0.5rem;
    }
  `,
})
export class AboutComponent {}
