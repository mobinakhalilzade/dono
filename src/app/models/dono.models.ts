export type CreatorCategory =
  | 'podcast'
  | 'illustration'
  | 'tech'
  | 'writing'
  | 'music'
  | 'video';

export const CATEGORY_LABELS: Record<CreatorCategory, string> = {
  podcast: 'پادکست',
  illustration: 'طراحی و تصویرسازی',
  tech: 'برنامه‌نویسی و فناوری',
  writing: 'نویسندگی و خبرنامه',
  music: 'موسیقی و صدا',
  video: 'ویدیو و انیمیشن',
};

export interface SocialLink {
  platform: 'instagram' | 'telegram' | 'youtube' | 'x' | 'website' | 'github';
  label: string;
  url: string;
}

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  tagline: string;
  bio: string;
  category: CreatorCategory;
  avatarUrl: string;
  coverUrl: string;
  minSupportAmount: number;
  supportersCount: number;
  totalRaised: number;
  verified: boolean;
  activated?: boolean;
  socialLinks: SocialLink[];
  createdAt: string;
  ownerEmail?: string;
}

export type PostKind = 'general' | 'goal';

export interface CreatorPost {
  id: string;
  creatorUsername: string;
  kind: PostKind;
  title: string;
  excerpt: string;
  content: string;
  targetAmount?: number;
  raisedAmount: number;
  createdAt: string;
  likesCount: number;
}

export interface SupporterMessage {
  id: string;
  creatorUsername: string;
  supporterName: string;
  isAnonymous: boolean;
  amount: number;
  message: string;
  postId?: string;
  postTitle?: string;
  createdAt: string;
}

export interface PayoutRecord {
  id: string;
  creatorUsername: string;
  amount: number;
  ibanMasked: string;
  status: 'paid' | 'pending';
  createdAt: string;
}

export interface MonthlyEarning {
  monthLabel: string;
  amount: number;
  supporters: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  username: string | null;
  avatarUrl: string;
  onboarded: boolean;
  activated?: boolean;
  birthDateJalali?: string;
  nationalCode?: string;
  sheba?: string;
  provider?: 'google' | 'credentials' | 'demo';
}

export interface SupportRequestPayload {
  creatorUsername: string;
  supporterName: string;
  isAnonymous: boolean;
  amount: number;
  message: string;
  postId?: string;
  postTitle?: string;
}

export type ThankYouAnimationId =
  | 'standard'
  | 'confetti-celebration'
  | 'coral-hearts'
  | 'fireworks-gala'
  | 'golden-trophy';

export interface ThankYouAnimationPack {
  id: ThankYouAnimationId;
  name: string;
  subtitle: string;
  description: string;
  priceToman: number;
  isPremium: boolean;
  accentColor: string;
  secondaryColor: string;
  badgeLabel: string;
}

export interface CreatorAnimationConfig {
  creatorUsername: string;
  ownedIds: ThankYouAnimationId[];
  activeId: ThankYouAnimationId;
  thankYouNote: string;
}

