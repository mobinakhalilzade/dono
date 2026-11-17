import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="static-page">
      <div class="container static-narrow">
        <header class="static-head">
          <h1 class="static-title balance-text">قوانین و مقررات استفاده از دونو</h1>
          <p class="static-lead">آخرین به‌روزرسانی: آبان ۱۴۰۵</p>
        </header>

        <div class="surface-card legal-card">
          <section>
            <h2>۱. شرایط عضویت آفرینندگان</h2>
            <p>
              ایجاد صفحه در دونو برای آفرینندگان محتوای قانونی، آموزشی، هنری، فناوری و فرهنگی آزاد است. مسئولیت صحت اطلاعات حساب و محتوای منتشرشده بر عهده دارنده صفحه است.
            </p>
          </section>
          <section>
            <h2>۲. ماهیت حمایت‌های مالی</h2>
            <p>
              مبالغ پرداخت‌شده از طریق دونو به عنوان حمایت داوطلبانه از آفریننده محسوب می‌شوند و تعهد فروش کالا یا قرارداد تجاری جداگانه ایجاد نمی‌کنند.
            </p>
          </section>
          <section>
            <h2>۳. کارمزد و تسویه حساب</h2>
            <p>
              کارمزد پلتفرم ۵ درصد از هر تراکنش موفق است و مابقی مبلغ پس از ثبت درخواست تسویه و تایید شماره شبا به حساب آفریننده واریز می‌گردد.
            </p>
          </section>
        </div>
      </div>
    </article>
  `,
  styles: `
    .static-page { padding-block: 3rem 2rem; }
    .static-narrow { max-inline-size: 760px; }
    .static-head { margin-block-end: 1.5rem; }
    .static-title { margin: 0; font-size: clamp(1.65rem, 3vw, 2.25rem); font-weight: 800; }
    .static-lead { margin: 0.4rem 0 0; color: var(--text-muted); font-size: 0.9rem; }
    .legal-card { padding: 1.75rem; display: flex; flex-direction: column; gap: 1.4rem; }
    .legal-card h2 { margin: 0 0 0.45rem; font-size: 1.125rem; font-weight: 700; }
    .legal-card p { margin: 0; color: var(--text-secondary); }
  `,
})
export class TermsComponent {}
