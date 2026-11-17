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
  templateUrl: './share-modal.html',
  styleUrl: './share-modal.scss',
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
