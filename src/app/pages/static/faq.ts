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
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
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
