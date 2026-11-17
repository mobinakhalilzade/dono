import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hero-illustration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hero-stage" aria-hidden="true">
      <!-- Soft Gradient Mesh Blobs -->
      <div class="mesh-blob mesh-blob-primary"></div>
      <div class="mesh-blob mesh-blob-secondary"></div>
      <div class="mesh-blob mesh-blob-soft"></div>

      <!-- Decorative Inline SVG Orbital Rings & Sparkles -->
      <svg class="hero-bg-svg" viewBox="0 0 520 480" fill="none">
        <circle
          class="orbital-outer"
          cx="260"
          cy="240"
          r="195"
          stroke="currentColor"
          stroke-opacity="0.1"
          stroke-width="1.5"
          stroke-dasharray="6 8"
        />
        <circle
          cx="260"
          cy="240"
          r="145"
          stroke="currentColor"
          stroke-opacity="0.06"
          stroke-width="1.5"
        />
        <circle cx="88" cy="112" r="6" fill="var(--accent-vivid)" fill-opacity="0.72" />
        <circle cx="446" cy="364" r="8" fill="var(--secondary-accent-vivid)" fill-opacity="0.6" />
        <path
          class="sparkle-a"
          d="M422 88L426 98L436 102L426 106L422 116L418 106L408 102L418 98Z"
          fill="var(--secondary-accent-vivid)"
          fill-opacity="0.92"
        />
        <path
          class="sparkle-b"
          d="M78 342L81 349L88 352L81 355L78 362L75 355L68 352L75 349Z"
          fill="var(--accent-vivid)"
          fill-opacity="0.88"
        />
      </svg>

      <!-- Stylized Phone Mockup of a Creator Page -->
      <div class="phone-mockup">
        <div class="phone-notch"></div>
        <div class="phone-screen">
          <div class="phone-cover">
            <svg viewBox="0 0 280 86" fill="none" class="phone-cover-svg">
              <rect width="280" height="86" fill="var(--accent-soft)" />
              <circle cx="48" cy="24" r="36" fill="var(--accent-vivid)" fill-opacity="0.28" />
              <circle cx="234" cy="64" r="42" fill="var(--secondary-accent-vivid)" fill-opacity="0.24" />
              <path
                d="M0 68C58 52 108 82 172 64C214 52 248 56 280 68V86H0V68Z"
                fill="var(--accent-vivid)"
                fill-opacity="0.22"
              />
            </svg>
          </div>

          <div class="phone-profile-head">
            <div class="phone-avatar">
              <svg viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="var(--bg-subtle)" />
                <circle cx="24" cy="19" r="8" fill="var(--secondary-accent-vivid)" />
                <path d="M10 41C10 33.8 16.3 29 24 29C31.7 29 38 33.8 38 41" fill="var(--accent)" />
              </svg>
            </div>
            <div class="phone-creator-info">
              <div class="phone-name-row">
                <strong>سارا محمدی</strong>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
                  <circle cx="8" cy="8" r="7" fill="var(--secondary-accent)" />
                  <path d="M5 8.2L7 10.2L11.2 6" stroke="var(--secondary-accent-text)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <span dir="ltr">dono.com/&#64;sara_art</span>
            </div>
          </div>

          <div class="phone-support-card">
            <div class="phone-support-head">
              <span class="phone-support-label">انتخاب مبلغ حمایت (تومان)</span>
              <span class="phone-special-tag">ویژه</span>
            </div>
            <div class="phone-chips-grid">
              <span class="phone-chip">۵۰٬۰۰۰</span>
              <span class="phone-chip is-selected">۱۰۰٬۰۰۰</span>
              <span class="phone-chip">۲۰۰٬۰۰۰</span>
              <span class="phone-chip">۵۰۰٬۰۰۰</span>
            </div>
            <div class="phone-message-bar">فصل جدید پادکست منتشر شد؛ همین حالا گوش بده!</div>
            <div class="phone-cta-btn">حمایت مالی · ۱۰۰٬۰۰۰ تومان</div>
          </div>
        </div>
      </div>

      <!-- Floating Card 1: Creator Profile & Growth -->
      <div class="float-card float-profile-card">
        <div class="float-profile-head">
          <div class="float-mini-avatar">
            <svg viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="var(--accent-soft)" />
              <circle cx="18" cy="14" r="5.5" fill="var(--accent)" />
              <path d="M8 31C8 25.8 12.5 22 18 22C23.5 22 28 25.8 28 31" fill="var(--secondary-accent)" />
            </svg>
          </div>
          <div>
            <strong>علی رضایی</strong>
            <span>پادکست و فناوری · ۳۱۲ حامی</span>
          </div>
        </div>
        <div class="float-sparkline-row">
          <span class="float-stat-val tabular-nums">+۲۸٪ رشد ماهانه</span>
          <svg viewBox="0 0 88 28" width="88" height="28" fill="none">
            <path
              class="sparkline-path"
              d="M2 24C14 22 20 15 32 16C44 17 50 9 62 10C72 11 78 4 86 2"
              stroke="var(--secondary-accent)"
              stroke-width="2.4"
              stroke-linecap="round"
            />
            <circle class="sparkline-dot" cx="86" cy="2" r="3" fill="var(--secondary-accent)" />
          </svg>
        </div>
      </div>

      <!-- Floating Card 2: Support Notification -->
      <div class="float-card float-notif-card">
        <div class="notif-badge-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20.5s-7.5-4.8-7.5-10.2A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.5 3.3c0 5.4-7.5 10.2-7.5 10.2Z" />
          </svg>
        </div>
        <div class="notif-copy">
          <div class="notif-title-line">
            <span class="notif-live-dot"></span>
            <strong>حمایت جدید دریافت شد</strong>
          </div>
          <span class="notif-amount tabular-nums">۲۰۰٬۰۰۰ تومان از مریم</span>
        </div>
      </div>
    </div>
  `,
  styles: `
    .hero-stage {
      position: relative;
      min-block-size: 460px;
      width: 100%;
      max-inline-size: 560px;
      margin-inline: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.25rem 0.5rem 2.75rem;
      isolation: isolate;
    }

    @media (min-width: 960px) {
      .hero-stage {
        min-block-size: 500px;
      }
    }

    .mesh-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(52px);
      z-index: -2;
      pointer-events: none;
    }

    .mesh-blob-primary {
      inline-size: 270px;
      block-size: 270px;
      background: radial-gradient(circle, var(--hero-blob-primary), transparent 70%);
      inset-block-start: 6%;
      inset-inline-end: 8%;
      animation: blobDrift 14s ease-in-out infinite alternate;
    }

    .mesh-blob-secondary {
      inline-size: 255px;
      block-size: 255px;
      background: radial-gradient(circle, var(--hero-blob-secondary), transparent 70%);
      inset-block-end: 2%;
      inset-inline-start: 4%;
      animation: blobDrift 17s ease-in-out infinite alternate-reverse;
    }

    .mesh-blob-soft {
      inline-size: 210px;
      block-size: 210px;
      background: radial-gradient(circle, var(--hero-blob-primary), transparent 72%);
      inset-block-start: 35%;
      inset-inline-start: 22%;
    }

    .hero-bg-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      color: var(--text-primary);
      pointer-events: none;
    }

    .orbital-outer {
      transform-box: fill-box;
      transform-origin: center;
      animation: orbitalSpin 48s linear infinite;
    }

    .sparkle-a {
      transform-box: fill-box;
      transform-origin: center;
      animation: sparkleTwinkle 3.6s ease-in-out infinite;
    }

    .sparkle-b {
      transform-box: fill-box;
      transform-origin: center;
      animation: sparkleTwinkle 4.4s 1.1s ease-in-out infinite;
    }

    .phone-mockup {
      position: relative;
      inline-size: min(100%, 284px);
      margin-block-start: 1.5rem;
      padding: 0.6rem;
      border-radius: 32px;
      background-color: #19192E;
      box-shadow: 0 28px 54px -22px rgba(15, 15, 28, 0.38);
      border: 1px solid rgba(241, 241, 250, 0.16);
      animation: heroMockupEnter 700ms 90ms cubic-bezier(0.16, 1, 0.3, 1) both;
      transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .hero-stage:hover .phone-mockup {
      transform: translateY(-4px);
    }

    .phone-notch {
      inline-size: 76px;
      block-size: 16px;
      border-radius: 999px;
      background-color: #19192E;
      margin-inline: auto;
      position: relative;
      z-index: 2;
      margin-block-end: -10px;
    }

    .phone-screen {
      border-radius: 24px;
      background-color: var(--bg-surface);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-subtle);
    }

    .phone-cover {
      block-size: 80px;
      overflow: hidden;
    }

    .phone-cover-svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .phone-profile-head {
      padding: 0 0.9rem 0.75rem;
      display: flex;
      align-items: flex-end;
      gap: 0.6rem;
      margin-block-start: -1.25rem;
    }

    .phone-avatar {
      inline-size: 48px;
      block-size: 48px;
      border-radius: 14px;
      border: 3px solid var(--bg-surface);
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 6px 14px -6px rgba(15, 20, 16, 0.2);
    }

    .phone-avatar svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .phone-creator-info {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-inline-size: 0;
      padding-block-start: 1.45rem;
    }

    .phone-name-row {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .phone-creator-info span {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .phone-support-card {
      margin: 0 0.75rem 0.85rem;
      padding: 0.85rem;
      border-radius: 16px;
      background-color: var(--bg-canvas);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .phone-support-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .phone-support-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
    }

    .phone-special-tag {
      padding: 0.12rem 0.45rem;
      border-radius: 6px;
      background-color: var(--secondary-accent-soft);
      color: var(--secondary-accent-ink);
      font-size: 0.68rem;
      font-weight: 700;
    }

    .phone-chips-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.4rem;
    }

    .phone-chip {
      text-align: center;
      padding: 0.4rem 0.25rem;
      border-radius: 10px;
      border: 1px solid var(--border-subtle);
      background-color: var(--bg-surface);
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .phone-chip.is-selected {
      background-color: var(--accent);
      color: var(--accent-text);
      border-color: var(--accent-hover);
      font-weight: 800;
    }

    .phone-message-bar {
      padding: 0.5rem 0.65rem;
      border-radius: 10px;
      background-color: var(--bg-subtle);
      font-size: 0.72rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .phone-cta-btn {
      text-align: center;
      padding: 0.55rem 0.75rem;
      border-radius: 12px;
      background-color: var(--accent);
      color: var(--accent-text);
      font-size: 0.8rem;
      font-weight: 800;
    }

    .float-card {
      position: absolute;
      border-radius: 18px;
      background-color: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 18px 36px -14px rgba(15, 20, 16, 0.2);
      padding: 0.8rem 0.95rem;
      z-index: 3;
      transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 280ms ease;
    }

    .float-profile-card {
      inset-block-start: 0.25rem;
      inset-inline-start: 0;
      max-inline-size: 196px;
      display: none;
      flex-direction: column;
      gap: 0.5rem;
      animation:
        floatCardIn 600ms 240ms cubic-bezier(0.16, 1, 0.3, 1) both,
        floatSlow 6s 840ms ease-in-out infinite;
    }

    .sparkline-path {
      stroke-dasharray: 120;
      stroke-dashoffset: 120;
      animation: sparklineDraw 1.1s 480ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .sparkline-dot {
      transform-box: fill-box;
      transform-origin: center;
      animation: dotPop 420ms 1.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @media (min-width: 540px) {
      .float-profile-card {
        display: flex;
      }
    }

    .float-profile-head {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    .float-mini-avatar {
      inline-size: 36px;
      block-size: 36px;
      border-radius: 10px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .float-profile-head strong {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .float-profile-head span {
      display: block;
      font-size: 0.71rem;
      color: var(--text-muted);
    }

    .float-sparkline-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding-block-start: 0.35rem;
      border-block-start: 1px solid var(--border-subtle);
    }

    .float-stat-val {
      font-size: 0.74rem;
      font-weight: 700;
      color: var(--success-text);
    }

    .float-notif-card {
      inset-block-end: 0.25rem;
      inset-inline-end: 0;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      border-block-start: 3px solid var(--secondary-accent);
      animation:
        floatCardIn 600ms 380ms cubic-bezier(0.16, 1, 0.3, 1) both,
        floatReverse 6.5s 980ms ease-in-out infinite;
    }

    .notif-badge-icon {
      inline-size: 36px;
      block-size: 36px;
      border-radius: 12px;
      background-color: var(--secondary-accent-soft);
      color: var(--secondary-accent-ink);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notif-copy {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .notif-title-line {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
    }

    .notif-live-dot {
      inline-size: 7px;
      block-size: 7px;
      border-radius: 50%;
      background-color: var(--secondary-accent);
    }

    .notif-amount {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    @keyframes orbitalSpin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes sparkleTwinkle {
      0%, 100% {
        opacity: 0.55;
        transform: scale(0.92);
      }
      50% {
        opacity: 1;
        transform: scale(1.12);
      }
    }

    @keyframes blobDrift {
      from {
        transform: translate(0, 0) scale(1);
      }
      to {
        transform: translate(14px, -12px) scale(1.06);
      }
    }

    @keyframes sparklineDraw {
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes dotPop {
      from {
        opacity: 0;
        transform: scale(0);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes floatCardIn {
      from {
        opacity: 0;
        transform: translateY(14px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes heroMockupEnter {
      from {
        opacity: 0;
        transform: translateY(18px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes floatSlow {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }

    @keyframes floatReverse {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(7px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .phone-mockup,
      .float-profile-card,
      .float-notif-card,
      .orbital-outer,
      .sparkle-a,
      .sparkle-b,
      .mesh-blob-primary,
      .mesh-blob-secondary,
      .sparkline-path,
      .sparkline-dot {
        animation: none;
        stroke-dashoffset: 0;
      }
    }
  `,
})
export class HeroIllustrationComponent {}
