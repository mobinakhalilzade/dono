import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '../../components/icon/icon';

interface FaqRow {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon],
  template: `
    <section class="static-page">
      <div class="container static-narrow">
        <header class="static-head">
          <h1 class="static-title balance-text">سوالات متداول</h1>
          <p class="static-lead">پاسخ به پرسش‌های رایج آفرینندگان و حامیان دونو</p>
        </header>

        <div class="faq-stack">
          @for (item of items; track item.id) {
            <div class="surface-card faq-box">
              <button
                type="button"
                class="faq-btn"
                [attr.aria-expanded]="openId() === item.id"
                (click)="toggle(item.id)"
              >
                <span>{{ item.question }}</span>
                <app-icon name="chevron-down" [size]="18" />
              </button>
              @if (openId() === item.id) {
                <div class="faq-content">
                  <p>{{ item.answer }}</p>
                </div>
              }
            </div>
          }
        </div>

        <div class="surface-card contact-callout">
          <div>
            <h2>پاسخ سوال خود را پیدا نکردید؟</h2>
            <p>تیم پشتیبانی دونو آماده پاسخ‌گویی به پیام‌های شماست.</p>
          </div>
          <a routerLink="/contact" class="btn btn-primary">تماس با ما</a>
        </div>
      </div>
    </section>
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
      margin: 0.5rem 0 0;
      color: var(--text-secondary);
    }
    .faq-stack {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .faq-btn {
      width: 100%;
      min-block-size: 54px;
      padding: 1rem 1.25rem;
      background: transparent;
      border: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      text-align: start;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: color var(--transition-fast);
    }
    .faq-btn app-icon {
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .faq-btn[aria-expanded='true'] {
      color: var(--secondary-accent-ink);
    }
    .faq-btn[aria-expanded='true'] app-icon {
      transform: rotate(180deg);
    }
    .faq-content {
      padding-inline: 1.25rem;
      padding-block-end: 1.15rem;
      color: var(--text-secondary);
      animation: dastFadeSlideUp 220ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .faq-content p {
      margin: 0;
    }
    .contact-callout {
      margin-block-start: 2rem;
      padding: 1.5rem;
      border-inline-start: 3px solid var(--secondary-accent);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .contact-callout h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
    }
    .contact-callout p {
      margin: 0.25rem 0 0;
      color: var(--text-secondary);
      font-size: 0.9375rem;
    }
  `,
})
export class FaqComponent {
  protected readonly openId = signal<string | null>('f1');

  protected readonly items: FaqRow[] = [
    {
      id: 'f1',
      question: 'دونو چگونه کار می‌کند؟',
      answer:
        'شما یک صفحه شخصی با نام کاربری اختصاصی می‌سازید و لینک یا کد QR آن را با دنبال‌کنندگان خود به اشتراک می‌گذارید. مخاطبان با انتخاب مبالغ پیشنهادی یا وارد کردن مبلغ دلخواه به تومان از شما حمایت می‌کنند.',
    },
    {
      id: 'f2',
      question: 'کارمزد دونو چقدر است؟',
      answer:
        'عضویت و داشتن صفحه رایگان است. تنها ۵ درصد کارمزد بابت زیرساخت و نگهداری از هر تراکنش کسر می‌شود و ۹۵ درصد مبلغ به موجودی قابل تسویه شما اضافه می‌گردد.',
    },
    {
      id: 'f3',
      question: 'حداقل مبلغ حمایت و تسویه چقدر است؟',
      answer:
        'حداقل مبلغ هر حمایت ۱۰٬۰۰۰ تومان و حداقل مبلغ درخواست تسویه شبا ۱۰۰٬۰۰۰ تومان تعیین شده است.',
    },
    {
      id: 'f4',
      question: 'آیا حامیان می‌توانند بدون نمایش نام حمایت کنند؟',
      answer:
        'بله، در فرم حمایت گزینه «حمایت به صورت ناشناس ثبت شود» وجود دارد که نام حامی را در دیوار عمومی پنهان نگه می‌دارد.',
    },
    {
      id: 'f5',
      question: 'زمان واریز درخواست‌های تسویه چه موقع است؟',
      answer:
        'درخواست‌های تسویه ثبت‌شده در داشبورد به صورت هفتگی و مستقیم به شماره شبای تاییدشده شما واریز می‌شوند.',
    },
  ];

  protected toggle(id: string): void {
    this.openId.update((cur) => (cur === id ? null : id));
  }
}
