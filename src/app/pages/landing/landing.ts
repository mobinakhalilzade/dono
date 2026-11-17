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
  template: `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container hero-grid">
        <div class="hero-copy hero-enter">
          <div class="hero-eyebrow">
            <span class="eyebrow-dot" aria-hidden="true"></span>
            <span>پلتفرم حمایت مستقیم از آفرینندگان فارسی</span>
          </div>

          <h1 class="hero-title balance-text">
            حمایت مالی مستقیم،
            <span class="hero-highlight">ساده و شفاف</span>
            برای آفرینندگان مستقل
          </h1>

          <p class="hero-subtitle">
            در کمتر از دو دقیقه صفحه شخصی دونو خود را بسازید، لینک اختصاصی یا کد QR آن را با مخاطبان به اشتراک بگذارید و حمایت مالی را مستقیم به تومان دریافت کنید.
          </p>

          <div class="hero-actions">
            <a routerLink="/login" class="btn btn-primary hero-primary-cta">
              <app-icon name="brand" [size]="18" />
              <span>ساخت صفحه رایگان</span>
            </a>
            <a routerLink="/explore" class="btn btn-secondary">
              <span>کاوش آفرینندگان</span>
              <app-icon name="arrow-left" [size]="17" />
            </a>
          </div>

          <div class="meta-row hero-trust">
            <span>راه‌اندازی رایگان</span>
            <span aria-hidden="true">·</span>
            <span>بدون نیاز به درگاه شخصی</span>
            <span aria-hidden="true">·</span>
            <span>تسویه مستقیم به شبا</span>
          </div>
        </div>

        <app-hero-illustration />
      </div>
    </section>

    <!-- Proof Strip -->
    <section class="proof-strip scroll-reveal">
      <div class="container proof-grid">
        <div class="proof-item reveal-item">
          <strong class="proof-value tabular-nums">+۱٬۲۰۰</strong>
          <span class="proof-label">آفریننده فعال در حوزه‌های پادکست، هنر و فناوری</span>
        </div>
        <div class="proof-item reveal-item">
          <strong class="proof-value tabular-nums">۴۸٬۵۰۰+</strong>
          <span class="proof-label">حمایت موفق ثبت‌شده در شش ماه گذشته</span>
        </div>
        <div class="proof-item reveal-item">
          <strong class="proof-value tabular-nums">۹۵٪</strong>
          <span class="proof-label">سهم خالص آفریننده با تسویه شفاف و زمان‌بندی‌شده</span>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="section-block scroll-reveal">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title balance-text">دونو چطور کار می‌کند؟</h2>
          <p class="section-desc">سه مرحله ساده از ساخت صفحه تا دریافت اولین حمایت</p>
        </div>

        <div class="steps-grid">
          <article class="surface-card step-card reveal-item">
            <span class="step-num tabular-nums">۰۱</span>
            <h3 class="step-title">صفحه خود را بسازید</h3>
            <p class="step-text">
              با حساب گوگل وارد شوید، نام کاربری دلخواهتان را انتخاب کنید و حداقل مبلغ حمایت را به تومان مشخص نمایید.
            </p>
          </article>

          <article class="surface-card step-card reveal-item">
            <span class="step-num tabular-nums">۰۲</span>
            <h3 class="step-title">لینک یا کد QR را به اشتراک بگذارید</h3>
            <p class="step-text">
              لینک اختصاصی یا کد QR صفحه دونو خود را در توضیحات پادکست، بیو اینستاگرام، کانال تلگرام یا ویدیوها قرار دهید.
            </p>
          </article>

          <article class="surface-card step-card reveal-item">
            <span class="step-num tabular-nums">۰۳</span>
            <h3 class="step-title">حمایت و پیام بگیرید</h3>
            <p class="step-text">
              مخاطبان بدون نیاز به ثبت‌نام طولانی با انتخاب مبالغ پیشنهادی یا مبلغ دلخواه از شما حمایت می‌کنند و پیامشان روی دیوار حامیان ثبت می‌شود.
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- Features Asymmetric Bento -->
    <section class="section-block scroll-reveal">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title balance-text">ابزارهایی برای رشد پایدار کارهای مستقل</h2>
          <p class="section-desc">هر آنچه یک آفریننده فارسی برای ارتباط مالی و صمیمی با مخاطبانش نیاز دارد</p>
        </div>

        <div class="bento-grid">
          <article class="surface-card bento-item bento-wide reveal-item">
            <div class="bento-icon-wrap">
              <app-icon name="wallet" [size]="20" />
            </div>
            <h3 class="bento-title">انتخاب سریع مبلغ به تومان بدون پیچیدگی</h3>
            <p class="bento-text">
              حامیان می‌توانند با یک کلیک یکی از مبالغ آماده ۵۰٬۰۰۰ تا ۵۰۰٬۰۰۰ تومان را انتخاب کنند یا مبلغ دلخواه خودشان را وارد نمایند. تمام ارقام به تومان و با شفافیت کامل نمایش داده می‌شوند.
            </p>
          </article>

          <article class="surface-card bento-item reveal-item">
            <div class="bento-icon-wrap is-warm">
              <app-icon name="qrcode" [size]="20" />
            </div>
            <h3 class="bento-title">اشتراک‌گذاری با لینک و کد QR</h3>
            <p class="bento-text">
              لینک کوتاه صفحه را کپی کنید یا کد QR اختصاصی را با کیفیت بالا دانلود کرده و در استوری، پوستر یا انتهای ویدیوها استفاده کنید.
            </p>
          </article>

          <article class="surface-card bento-item reveal-item">
            <div class="bento-icon-wrap is-warm">
              <app-icon name="heart" [size]="20" />
            </div>
            <h3 class="bento-title">دیوار حامیان و پیام ناشناس</h3>
            <p class="bento-text">
              هر حامی می‌تواند یادداشت محبت‌آمیزی کنار حمایتش بنویسد یا در صورت تمایل به صورت ناشناس مشارکت کند.
            </p>
          </article>

          <article class="surface-card bento-item bento-wide reveal-item">
            <div class="bento-icon-wrap">
              <app-icon name="chart" [size]="20" />
            </div>
            <h3 class="bento-title">داشبورد درآمد ماهانه و تسویه حساب شبا</h3>
            <p class="bento-text">
              روند رشد حمایت‌ها را با تقویم شمسی رصد کنید، نوشته‌های ویژه منتشر کنید و موجودی قابل تسویه خود را مستقیم به شماره شبا انتقال دهید.
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- Example Creators -->
    <section class="section-block scroll-reveal">
      <div class="container">
        <div class="section-head-row">
          <div>
            <h2 class="section-title balance-text">آفرینندگان فعال در دونو</h2>
            <p class="section-desc">نمونه صفحه‌های ساخته‌شده توسط پادکست‌سازان، نویسندگان و تصویرگران</p>
          </div>
          <a routerLink="/explore" class="btn btn-secondary btn-sm">
            <span>همه آفرینندگان</span>
            <app-icon name="arrow-left" [size]="16" />
          </a>
        </div>

        <div class="creators-grid">
          @for (creator of featuredCreators(); track creator.id) {
            <app-creator-card class="reveal-item" [creator]="creator" />
          }
        </div>
      </div>
    </section>

    <!-- FAQ Preview -->
    <section class="section-block scroll-reveal">
      <div class="container faq-layout">
        <div class="faq-intro">
          <h2 class="section-title balance-text">پرسش‌های پرتکرار</h2>
          <p class="section-desc">
            پاسخ کوتاه به سوالاتی که معمولاً پیش از ساخت صفحه می‌پرسید.
          </p>
          <a routerLink="/faq" class="faq-more-link">
            <span>مشاهده همه سوالات متداول</span>
            <app-icon name="arrow-left" [size]="16" />
          </a>
        </div>

        <div class="faq-list">
          @for (item of faqItems; track item.id) {
            <div class="surface-card faq-item">
              <button
                type="button"
                class="faq-trigger"
                (click)="toggleFaq(item.id)"
                [attr.aria-expanded]="openFaqId() === item.id"
              >
                <span>{{ item.question }}</span>
                <app-icon name="chevron-down" [size]="18" />
              </button>
              @if (openFaqId() === item.id) {
                <div class="faq-answer">
                  <p>{{ item.answer }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="section-block scroll-reveal">
      <div class="container">
        <div class="cta-banner">
          <div class="cta-copy">
            <h2 class="cta-title balance-text">صفحه دونو خودتان را همین امروز بسازید</h2>
            <p class="cta-text">
              تنها با یک کلیک با گوگل وارد شوید و لینک و کد QR اختصاصی حمایت خود را دریافت کنید.
            </p>
          </div>
          <a routerLink="/login" class="btn btn-primary">
            <span>شروع رایگان با گوگل</span>
            <app-icon name="arrow-left" [size]="18" />
          </a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero-section {
      padding-block: 2.5rem 2.75rem;
      overflow-x: clip;
      background:
        radial-gradient(ellipse 44% 58% at 22% 34%, var(--accent-soft), transparent 72%),
        radial-gradient(ellipse 38% 50% at 82% 28%, var(--secondary-accent-soft), transparent 70%);
    }

    @media (min-width: 960px) {
      .hero-section {
        padding-block: 4rem 4.25rem;
      }
    }

    .hero-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2.5rem;
      align-items: center;
    }

    @media (min-width: 960px) {
      .hero-grid {
        grid-template-columns: 1.05fr 0.95fr;
        gap: 3rem;
      }
    }

    .hero-copy {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1.25rem;
    }

    .hero-enter > * {
      animation: dastFadeSlideUp 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .hero-enter > :nth-child(1) { animation-delay: 20ms; }
    .hero-enter > :nth-child(2) { animation-delay: 90ms; }
    .hero-enter > :nth-child(3) { animation-delay: 160ms; }
    .hero-enter > :nth-child(4) { animation-delay: 230ms; }
    .hero-enter > :nth-child(5) { animation-delay: 290ms; }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      align-self: flex-start;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-md);
      background-color: var(--secondary-accent-soft);
      color: var(--secondary-accent-ink);
      font-size: 0.85rem;
      font-weight: 700;
    }

    .eyebrow-dot {
      inline-size: 8px;
      block-size: 8px;
      border-radius: 50%;
      background-color: var(--secondary-accent);
      flex-shrink: 0;
    }

    .hero-title {
      margin: 0;
      font-size: clamp(2rem, 4.1vw, 3.2rem);
      font-weight: 800;
      line-height: 1.24;
      letter-spacing: -0.015em;
    }

    .hero-highlight {
      color: var(--secondary-accent-ink);
    }

    .hero-subtitle {
      margin: 0;
      font-size: 1.0625rem;
      line-height: 1.8;
      color: var(--text-secondary);
      max-inline-size: 54ch;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.85rem;
      margin-block-start: 0.35rem;
    }

    .hero-primary-cta {
      box-shadow: 0 12px 26px -10px var(--accent-border);
    }

    .btn:hover app-icon[name='arrow-left'],
    .faq-more-link:hover app-icon {
      transform: translateX(-4px);
    }

    .hero-trust {
      margin-block-start: 0.25rem;
    }

    .proof-strip {
      border-block: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      padding-block: 2rem;
    }

    .proof-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .proof-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .proof-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding-inline-start: 0.9rem;
      border-inline-start: 3px solid var(--accent-border);
    }

    .proof-item:nth-child(2) {
      border-inline-start-color: var(--secondary-accent-border);
    }

    .proof-value {
      font-size: 1.85rem;
      font-weight: 800;
      line-height: 1.2;
      color: var(--success-text);
    }

    .proof-item:nth-child(2) .proof-value {
      color: var(--secondary-accent-ink);
    }

    .proof-label {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .section-block {
      padding-block: 4rem 0;
    }

    .section-head {
      margin-block-end: 2rem;
    }

    .section-head-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-block-end: 2rem;
    }

    .section-title {
      margin: 0;
      font-size: clamp(1.5rem, 2.6vw, 2.05rem);
      font-weight: 800;
      line-height: 1.3;
    }

    .section-desc {
      margin: 0.5rem 0 0;
      color: var(--text-secondary);
      font-size: 0.985rem;
    }

    .steps-grid,
    .bento-grid,
    .creators-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.35rem;
    }

    @media (min-width: 640px) {
      .creators-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 768px) {
      .steps-grid,
      .bento-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      .bento-wide {
        grid-column: span 2;
      }
    }

    @media (min-width: 1024px) {
      .creators-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .step-card,
    .bento-item {
      padding: 1.75rem;
      border-radius: 20px;
      box-shadow: 0 12px 28px -18px rgba(15, 20, 16, 0.14);
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      transition:
        transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
        border-color var(--transition-fast),
        box-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .step-card:hover,
    .bento-item:hover {
      transform: translateY(-4px);
      border-color: var(--accent-border);
      box-shadow: 0 20px 36px -22px rgba(15, 20, 16, 0.24);
    }

    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 46px;
      block-size: 46px;
      border-radius: 12px;
      background-color: var(--secondary-accent-soft);
      border: 1px solid var(--secondary-accent-border);
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--secondary-accent-ink);
      line-height: 1;
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .step-card:hover .step-num {
      transform: scale(1.08) rotate(-4deg);
    }

    .step-title,
    .bento-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .step-text,
    .bento-text {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--text-secondary);
    }

    .bento-icon-wrap {
      inline-size: 44px;
      block-size: 44px;
      border-radius: 12px;
      background-color: var(--accent-soft);
      color: var(--text-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .bento-item:hover .bento-icon-wrap {
      transform: scale(1.08) rotate(-4deg);
    }

    .bento-icon-wrap.is-warm {
      background-color: var(--secondary-accent-soft);
      color: var(--secondary-accent-ink);
      border: 1px solid var(--secondary-accent-border);
    }

    .faq-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.75rem;
    }

    @media (min-width: 900px) {
      .faq-layout {
        grid-template-columns: 0.9fr 1.1fr;
        gap: 3rem;
      }
    }

    .faq-more-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-block-start: 1rem;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--secondary-accent-ink);
      text-decoration: underline;
      text-underline-offset: 4px;
    }

    .faq-more-link app-icon {
      transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .faq-item {
      overflow: hidden;
      border-radius: 18px;
    }

    .faq-trigger {
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
      font-size: 0.975rem;
      font-weight: 600;
      cursor: pointer;
      transition: color var(--transition-fast);
    }

    .faq-trigger app-icon {
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .faq-trigger[aria-expanded='true'] {
      color: var(--secondary-accent-ink);
    }

    .faq-trigger[aria-expanded='true'] app-icon {
      transform: rotate(180deg);
    }

    .faq-answer {
      padding-inline: 1.25rem;
      padding-block-end: 1.15rem;
      color: var(--text-secondary);
      font-size: 0.9375rem;
      animation: dastFadeSlideUp 220ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .faq-answer p {
      margin: 0;
    }

    .cta-banner {
      padding: 2.25rem;
      border-radius: 24px;
      background: linear-gradient(
        135deg,
        var(--bg-surface) 22%,
        var(--accent-soft) 74%,
        var(--secondary-accent-soft) 100%
      );
      border: 1px solid var(--accent-border);
      box-shadow: 0 18px 36px -22px rgba(15, 15, 28, 0.16);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      transition: transform 240ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .cta-banner:hover {
      transform: translateY(-2px);
      box-shadow: 0 24px 44px -24px rgba(15, 20, 16, 0.24);
    }

    .cta-title {
      margin: 0;
      font-size: 1.45rem;
      font-weight: 800;
    }

    .cta-text {
      margin: 0.4rem 0 0;
      color: var(--text-secondary);
    }
  `,
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
