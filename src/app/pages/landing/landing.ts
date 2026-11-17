import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CreatorCard } from '../../components/creator-card/creator-card';
import { HeroIllustrationComponent } from '../../components/hero-illustration/hero-illustration';
import { AppIcon } from '../../components/icon/icon';
import { CreatorService } from '../../services/creator.service';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CreatorCard, HeroIllustrationComponent, AppIcon],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private readonly creatorService = inject(CreatorService);
  private readonly elRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;
  private revealFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly openFaqId = signal<string | null>('q1');
  protected readonly featuredCreators = computed(() => this.creatorService.creators().slice(0, 3));

  protected readonly faqItems: FaqItem[] = [
    {
      id: 'q1',
      question: 'ساخت صفحه در دونو چقدر هزینه دارد؟',
      answer:
        'ساخت صفحه، انتشار نوشته‌ها و دریافت حمایت کاملاً رایگان است و هیچ هزینه اشتراک ماهانه‌ای ندارد. کارمزد پلتفرم تنها ۵ درصد از مبلغ حمایت‌های دریافتی است.',
    },
    {
      id: 'q2',
      question: 'حامیان برای پرداخت نیاز به ساخت حساب دارند؟',
      answer:
        'خیر. مخاطبان شما می‌توانند بدون ثبت‌نام، تنها با انتخاب یا وارد کردن مبلغ حمایت به تومان و نوشتن نام (یا به صورت ناشناس) حمایت خود را ارسال کنند.',
    },
    {
      id: 'q3',
      question: 'تسویه حساب درآمد آفرینندگان چطور انجام می‌شود؟',
      answer:
        'در بخش تسویه حساب داشبورد می‌توانید موجودی قابل برداشت را با ثبت شماره شبا درخواست دهید تا در سیکل هفتگی به حساب بانکی شما واریز شود.',
    },
    {
      id: 'q4',
      question: 'آیا می‌توانم حداقل مبلغ حمایت صفحه‌ام را تغییر بدهم؟',
      answer:
        'بله، در ویرایشگر صفحه داخل داشبورد در هر زمان می‌توانید حداقل مبلغ حمایت، توضیحات بیو و تصویر کاور صفحه خود را تغییر دهید.',
    },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const sections = Array.from(
      this.elRef.nativeElement.querySelectorAll('.scroll-reveal'),
    ) as HTMLElement[];
    const viewportBottom = window.innerHeight || 900;

    for (const sec of sections) {
      const rect = sec.getBoundingClientRect();
      if (rect.top > viewportBottom - 40) {
        sec.classList.add('is-pending');
      } else {
        sec.classList.add('is-visible');
      }
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.remove('is-pending');
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '80px 0px', threshold: 0.05 },
    );

    for (const sec of sections) {
      if (sec.classList.contains('is-pending')) {
        this.observer.observe(sec);
      }
    }

    this.revealFallbackTimer = setTimeout(() => {
      for (const sec of sections) {
        sec.classList.remove('is-pending');
        sec.classList.add('is-visible');
      }
    }, 1500);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.revealFallbackTimer) {
      clearTimeout(this.revealFallbackTimer);
    }
  }

  protected toggleFaq(id: string): void {
    this.openFaqId.update((current) => (current === id ? null : id));
  }
}
