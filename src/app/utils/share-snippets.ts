import { getCreatorDisplayUrl, getCreatorShareUrl } from './formatters';

export type SharePlatformId = 'x' | 'instagram' | 'linkedin' | 'telegram' | 'whatsapp';

export interface SharePlatformOption {
  id: SharePlatformId;
  nameFa: string;
  channelHint: string;
  defaultSnippet: string;
  actionLabel: string | null;
}

export interface ShareSnippetContext {
  displayName: string;
  username: string;
}

export function buildPlatformShareOptions(ctx: ShareSnippetContext): SharePlatformOption[] {
  const name = ctx.displayName.trim() || 'این آفریننده';
  const cleanUser = ctx.username.replace(/^@/, '').trim().toLowerCase();
  const shareUrl = getCreatorShareUrl(cleanUser);
  const displayUrl = getCreatorDisplayUrl(cleanUser);

  return [
    {
      id: 'x',
      nameFa: 'ایکس (X)',
      channelHint: 'متن کوتاه و آماده همراه با لینک و هشتگ برای انتشار در ایکس',
      defaultSnippet: `اگر محتوای ${name} برایتان الهام‌بخش یا کاربردی بوده، می‌توانید مستقیم از طریق دونو از او حمایت کنید:\n${shareUrl}\n#دونو #حمایت_از_آفرینندگان`,
      actionLabel: 'اشتراک در ایکس',
    },
    {
      id: 'instagram',
      nameFa: 'اینستاگرام',
      channelHint: 'متن آماده برای کپشن پست یا استیکر لینک در استوری اینستاگرام',
      defaultSnippet: `همراهان عزیز؛ برای حمایت مستقیم از کارهای مستقل ${name} به تومان، می‌توانید از لینک صفحه دونو (یا کد QR استوری) استفاده کنید:\n${displayUrl}\n\n#دونو #حمایت_مالی #آفرینندگان_مستقل`,
      actionLabel: null,
    },
    {
      id: 'linkedin',
      nameFa: 'لینکدین',
      channelHint: 'متن حرفه‌ای مناسب پست یا معرفی فعالیت در شبکه لینکدین',
      defaultSnippet: `تداوم تولید محتوای باکیفیت و مستقل با همراهی مخاطبان ممکن می‌شود.\nاگر فعالیت‌های ${name} برایتان ارزشمند است، می‌توانید از طریق صفحه دونو مستقیماً حمایت کنید:\n${shareUrl}\n\n#دونو #تولید_محتوا #اقتصاد_آفرینندگان`,
      actionLabel: 'اشتراک در لینکدین',
    },
    {
      id: 'telegram',
      nameFa: 'تلگرام',
      channelHint: 'پیام آماده برای ارسال در کانال، گروه یا گفتگوی تلگرام',
      defaultSnippet: `سلام دوستان!\nبرای حمایت مستقیم و آسان از ${name} در دونو (به تومان و بدون نیاز به ثبت‌نام) از لینک زیر دیدن کنید:\n${shareUrl}`,
      actionLabel: 'ارسال در تلگرام',
    },
    {
      id: 'whatsapp',
      nameFa: 'واتساپ',
      channelHint: 'پیام صمیمی و کوتاه برای ارسال مستقیم در واتساپ',
      defaultSnippet: `سلام! صفحه دونو ${name} رو ببین، اگر کارهاش برات جالب بود می‌تونی خیلی راحت از اینجا حمایتش کنی: ${shareUrl}`,
      actionLabel: 'ارسال در واتساپ',
    },
  ];
}

export function buildPlatformIntentUrl(
  platform: SharePlatformId,
  snippet: string,
  shareUrl: string,
): string | null {
  const cleanSnippet = snippet.trim();
  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanSnippet)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    case 'telegram':
      return `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(cleanSnippet)}`;
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(cleanSnippet)}`;
    case 'instagram':
      return null;
  }
}
