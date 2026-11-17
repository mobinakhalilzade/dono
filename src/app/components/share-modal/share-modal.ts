import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import QRCode from 'qrcode';
import { getCreatorDisplayUrl, getCreatorShareUrl } from '../../utils/formatters';
import {
  SharePlatformId,
  buildPlatformIntentUrl,
  buildPlatformShareOptions,
} from '../../utils/share-snippets';
import { AppIcon } from '../icon/icon';

@Component({
  selector: 'app-share-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  template: `
    @if (open()) {
      <div
        class="share-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        (click)="onBackdropClick($event)"
      >
        <div class="surface-card share-modal-card">
          <div class="share-head">
            <div>
              <h2 id="share-modal-title" class="share-title">اشتراکگذاری صفحه {{ displayName() }}</h2>
              <p class="share-sub">لینک یا کد QR را ذخیره کنید یا با متن آماده در شبکه‌های اجتماعی منتشر نمایید.</p>
            </div>
            <button
              type="button"
              class="icon-close-btn"
              aria-label="بستن پنجره اشتراکگذاری"
              (click)="closed.emit()"
            >
              <app-icon name="close" [size]="18" />
            </button>
          </div>

          <!-- Method 1: Copyable Link -->
          <div class="share-block">
            <label for="share-url-input" class="field-label">لینک صفحه حمایت</label>
            <div class="copy-row">
              <input
                id="share-url-input"
                type="text"
                readonly
                dir="ltr"
                [value]="displayUrl()"
                class="field-input share-url-input"
                (click)="selectInput($event)"
              />
              <button type="button" class="btn btn-primary btn-sm copy-btn" (click)="copyLink()">
                @if (copied()) {
                  <app-icon name="check" [size]="16" />
                  <span>کپی شد</span>
                } @else {
                  <app-icon name="copy" [size]="16" />
                  <span>کپی لینک</span>
                }
              </button>
            </div>
          </div>

          <!-- Method 2: Social Apps with App-Customized Snippets -->
          <div class="social-share-block">
            <div class="social-head">
              <span class="field-label">اشتراک‌گذاری در شبکه‌های اجتماعی</span>
              <span class="social-hint">{{ selectedOption().channelHint }}</span>
            </div>

            <div class="platform-tabs" role="tablist" aria-label="انتخاب شبکه اجتماعی برای اشتراک‌گذاری">
              @for (opt of platformOptions(); track opt.id) {
                <button
                  type="button"
                  role="tab"
                  [attr.aria-selected]="selectedPlatform() === opt.id"
                  class="platform-tab"
                  [class.is-active]="selectedPlatform() === opt.id"
                  (click)="selectPlatform(opt.id)"
                >
                  <app-icon [name]="opt.id" [size]="15" />
                  <span>{{ opt.nameFa }}</span>
                </button>
              }
            </div>

            <div class="snippet-box">
              <label for="share-snippet-input" class="sr-only">
                متن آماده اشتراک‌گذاری در {{ selectedOption().nameFa }}
              </label>
              <textarea
                id="share-snippet-input"
                rows="4"
                class="field-textarea snippet-textarea"
                [value]="activeSnippet()"
                (input)="updateSnippet($any($event.target).value)"
              ></textarea>

              <div class="snippet-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="copySnippet()"
                >
                  @if (snippetCopied()) {
                    <app-icon name="check" [size]="15" />
                    <span>کپی شد</span>
                  } @else {
                    <app-icon name="copy" [size]="15" />
                    <span>کپی متن {{ selectedOption().nameFa }}</span>
                  }
                </button>

                @if (activeIntentUrl(); as intentHref) {
                  <a
                    [href]="intentHref"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-warm btn-sm"
                  >
                    <app-icon [name]="selectedOption().id" [size]="15" />
                    <span>{{ selectedOption().actionLabel }}</span>
                  </a>
                } @else {
                  <button
                    type="button"
                    class="btn btn-warm btn-sm"
                    [disabled]="!qrDataUrl()"
                    (click)="downloadQr()"
                  >
                    <app-icon name="download" [size]="15" />
                    <span>دانلود QR برای استوری</span>
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Method 3: QR Code + PNG Download -->
          <div class="qr-block">
            <div class="qr-preview-box">
              @if (qrDataUrl(); as qrSrc) {
                <img
                  [src]="qrSrc"
                  [alt]="'کد QR صفحه ' + displayName()"
                  class="qr-img"
                />
              } @else {
                <div class="skeleton qr-skeleton"></div>
              }
            </div>
            <div class="qr-info">
              <strong>کد QR اختصاصی</strong>
              <p>مخاطبان می‌توانند با اسکن این کد مستقیم وارد صفحه حمایت شما شوند.</p>
              <div class="qr-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  [disabled]="!qrDataUrl()"
                  (click)="downloadQr()"
                >
                  <app-icon name="download" [size]="16" />
                  <span>دانلود QR</span>
                </button>
                @if (canNativeShare()) {
                  <button type="button" class="btn btn-ghost btn-sm" (click)="nativeShare()">
                    <app-icon name="share" [size]="16" />
                    <span>اشتراک‌گذاری دستگاه</span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .share-backdrop {
      position: fixed;
      inset: 0;
      z-index: 70;
      background-color: rgba(18, 18, 16, 0.58);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: dastBackdropIn 180ms ease-out both;
    }

    .share-modal-card {
      width: 100%;
      max-inline-size: 560px;
      max-block-size: calc(100dvh - 2rem);
      overflow-y: auto;
      padding: 1.35rem;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      box-shadow: 0 20px 45px -16px rgba(0, 0, 0, 0.28);
      animation: dastModalPop 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .share-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .share-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
    }

    .share-sub {
      margin: 0.25rem 0 0;
      font-size: 0.86rem;
      color: var(--text-secondary);
    }

    .icon-close-btn {
      inline-size: 36px;
      block-size: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }

    .share-block,
    .social-share-block {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .copy-row {
      display: flex;
      align-items: stretch;
      gap: 0.5rem;
    }

    .share-url-input {
      text-align: left;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .copy-btn {
      min-inline-size: 106px;
    }

    .social-head {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .social-hint {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .platform-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }

    .platform-tab {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      min-block-size: 38px;
      padding: 0.4rem 0.78rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background-color: var(--bg-canvas);
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-secondary);
      white-space: nowrap;
      cursor: pointer;
      transition:
        background-color var(--transition-fast),
        border-color var(--transition-fast),
        color var(--transition-fast),
        transform var(--transition-fast);
    }

    .platform-tab:hover {
      border-color: var(--accent-border);
      color: var(--text-primary);
    }

    .platform-tab.is-active {
      background-color: var(--accent);
      border-color: var(--accent);
      color: var(--accent-text);
    }

    .snippet-box {
      padding: 0.85rem;
      border-radius: var(--radius-md);
      background-color: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .snippet-textarea {
      min-block-size: 118px;
      font-size: 0.855rem;
      line-height: 1.65;
      resize: vertical;
    }

    .snippet-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 479px) {
      .snippet-actions > * {
        flex: 1 1 100%;
      }
    }

    .qr-block {
      padding: 0.9rem;
      border-radius: var(--radius-md);
      background-color: var(--bg-subtle);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.9rem;
      text-align: center;
    }

    @media (min-width: 480px) {
      .qr-block {
        flex-direction: row;
        text-align: start;
      }
    }

    .qr-preview-box {
      inline-size: 112px;
      block-size: 112px;
      padding: 0.45rem;
      border-radius: var(--radius-md);
      background-color: #ffffff;
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .qr-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      animation: dastFadeSlideUp 220ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .qr-skeleton {
      width: 100%;
      height: 100%;
    }

    .qr-info {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .qr-info strong {
      font-size: 0.95rem;
      font-weight: 700;
    }

    .qr-info p {
      margin: 0;
      font-size: 0.825rem;
      color: var(--text-secondary);
    }

    .qr-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-start: 0.25rem;
      justify-content: center;
    }

    @media (min-width: 480px) {
      .qr-actions {
        justify-content: flex-start;
      }
    }
  `,
})
export class ShareModalComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly username = input.required<string>();
  readonly displayName = input.required<string>();
  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  protected readonly displayUrl = computed(() => getCreatorDisplayUrl(this.username()));
  protected readonly shareUrl = computed(() => getCreatorShareUrl(this.username()));
  protected readonly platformOptions = computed(() =>
    buildPlatformShareOptions({
      displayName: this.displayName(),
      username: this.username(),
    }),
  );

  protected readonly selectedPlatform = signal<SharePlatformId>('x');
  protected readonly customSnippets = signal<Partial<Record<SharePlatformId, string>>>({});
  protected readonly selectedOption = computed(
    () =>
      this.platformOptions().find((opt) => opt.id === this.selectedPlatform()) ??
      this.platformOptions()[0],
  );
  protected readonly activeSnippet = computed(
    () => this.customSnippets()[this.selectedPlatform()] ?? this.selectedOption().defaultSnippet,
  );
  protected readonly activeIntentUrl = computed(() =>
    buildPlatformIntentUrl(this.selectedPlatform(), this.activeSnippet(), this.shareUrl()),
  );

  protected readonly qrDataUrl = signal<string | null>(null);
  protected readonly copied = signal(false);
  protected readonly snippetCopied = signal(false);
  protected readonly canNativeShare = signal(
    isPlatformBrowser(this.platformId) &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function',
  );

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const targetUrl = this.shareUrl();
      if (!isOpen || !isPlatformBrowser(this.platformId)) {
        return;
      }
      this.copied.set(false);
      this.snippetCopied.set(false);
      this.customSnippets.set({});
      QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1c1a14',
          light: '#ffffff',
        },
      })
        .then((url) => this.qrDataUrl.set(url))
        .catch(() => this.qrDataUrl.set(null));
    });
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  protected selectInput(event: Event): void {
    const el = event.target as HTMLInputElement | null;
    el?.select();
  }

  protected selectPlatform(platform: SharePlatformId): void {
    this.selectedPlatform.set(platform);
    this.snippetCopied.set(false);
  }

  protected updateSnippet(value: string): void {
    const platform = this.selectedPlatform();
    this.customSnippets.update((cur) => ({ ...cur, [platform]: value }));
  }

  protected async copyLink(): Promise<void> {
    const url = this.shareUrl();
    if (isPlatformBrowser(this.platformId) && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard permission denied in restricted frames; still confirm copy action cleanly
      }
    }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2200);
  }

  protected async copySnippet(): Promise<void> {
    const text = this.activeSnippet();
    if (isPlatformBrowser(this.platformId) && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Clipboard permission denied in restricted frames; still confirm copy action cleanly
      }
    }
    this.snippetCopied.set(true);
    setTimeout(() => this.snippetCopied.set(false), 2200);
  }

  protected downloadQr(): void {
    const dataUrl = this.qrDataUrl();
    if (!dataUrl || !isPlatformBrowser(this.platformId)) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `dono-${this.username().replace(/^@/, '')}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  protected async nativeShare(): Promise<void> {
    if (!this.canNativeShare()) return;
    try {
      await navigator.share({
        title: `حمایت از ${this.displayName()} در دونو`,
        text: `از صفحه ${this.displayName()} در دونو دیدن کنید:`,
        url: this.shareUrl(),
      });
    } catch {
      // User cancelled native share sheet
    }
  }
}
