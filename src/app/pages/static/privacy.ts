import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="static-page">
      <div class="container static-narrow">
        <header class="static-head">
          <h1 class="static-title balance-text">سیاست حریم خصوصی</h1>
          <p class="static-lead">آخرین به‌روزرسانی: آبان ۱۴۰۵</p>
        </header>

        <div class="surface-card legal-card">
          <section>
            <h2>۱. اطلاعاتی که گردآوری می‌کنیم</h2>
            <p>
              هنگام ورود با گوگل تنها نام، آدرس ایمیل و تصویر پروفایل برای شناسایی حساب دریافت می‌شود. حامیان بدون نیاز به ایجاد حساب می‌توانند با نام دلخواه یا به صورت ناشناس حمایت خود را ثبت کنند.
            </p>
          </section>
          <section>
            <h2>۲. نگهداری و امنیت داده‌ها</h2>
            <p>
              اطلاعات بانکی و شماره شبای آفرینندگان صرفاً برای انجام تسویه حساب استفاده می‌شود و در اختیار اشخاص ثالث یا تبلیغ‌کنندگان قرار نمی‌گیرد.
            </p>
          </section>
          <section>
            <h2>۳. کنترل داده‌ها توسط کاربر</h2>
            <p>
              در هر زمان می‌توانید از طریق داشبورد، اطلاعات صفحه عمومی خود را ویرایش یا حذف کنید.
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
export class PrivacyComponent {}
