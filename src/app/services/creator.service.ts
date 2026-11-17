import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MOCK_CREATORS, MOCK_POSTS } from '../data/mock-data';
import { Creator, CreatorCategory, CreatorPost, PostKind } from '../models/dono.models';

const CREATORS_STORAGE_KEY = 'dono_creators_v2';
const POSTS_STORAGE_KEY = 'dono_posts_v2';

@Injectable({ providedIn: 'root' })
export class CreatorService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly creatorsState = signal<Creator[]>(this.loadInitialCreators());
  private readonly postsState = signal<CreatorPost[]>(this.loadInitialPosts());

  readonly creators = this.creatorsState.asReadonly();
  readonly posts = this.postsState.asReadonly();

  private loadInitialCreators(): Creator[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [...MOCK_CREATORS];
    }
    try {
      const raw = localStorage.getItem(CREATORS_STORAGE_KEY);
      if (!raw) return [...MOCK_CREATORS];
      const parsed = JSON.parse(raw) as Creator[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_CREATORS];
    } catch {
      return [...MOCK_CREATORS];
    }
  }

  private loadInitialPosts(): CreatorPost[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [...MOCK_POSTS];
    }
    try {
      const raw = localStorage.getItem(POSTS_STORAGE_KEY);
      if (!raw) return [...MOCK_POSTS];
      const parsed = JSON.parse(raw) as Partial<CreatorPost>[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return [...MOCK_POSTS];
      }
      return parsed.map((p) => ({
        id: p.id ?? `post-${Date.now()}`,
        creatorUsername: (p.creatorUsername ?? '').toLowerCase(),
        kind: p.kind === 'goal' ? 'goal' : 'general',
        title: p.title ?? '',
        excerpt: p.excerpt ?? '',
        content: p.content ?? '',
        targetAmount: typeof p.targetAmount === 'number' ? p.targetAmount : undefined,
        raisedAmount: typeof p.raisedAmount === 'number' ? p.raisedAmount : 0,
        createdAt: p.createdAt ?? new Date().toISOString(),
        likesCount: typeof p.likesCount === 'number' ? p.likesCount : 0,
      }));
    } catch {
      return [...MOCK_POSTS];
    }
  }

  private saveCreators(list: Creator[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage errors
    }
  }

  private savePosts(list: CreatorPost[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage errors
    }
  }

  async listCreators(): Promise<Creator[]> {
    return this.creatorsState();
  }

  async getByUsername(username: string): Promise<Creator | undefined> {
    const clean = username.replace(/^@/, '').toLowerCase();
    return this.creatorsState().find((c) => c.username.toLowerCase() === clean);
  }

  async getPostsByUsername(username: string): Promise<CreatorPost[]> {
    const clean = username.replace(/^@/, '').toLowerCase();
    return this.postsState().filter((p) => p.creatorUsername.toLowerCase() === clean);
  }

  filterCreators(
    query: string,
    category: CreatorCategory | 'all',
    sort: 'popular' | 'newest' | 'raised',
  ): Creator[] {
    const q = query.trim().toLowerCase();
    let list = this.creatorsState().filter((c) => {
      if (c.activated === false) {
        return false;
      }
      const matchesCategory = category === 'all' || c.category === category;
      if (!matchesCategory) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        c.displayName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q)
      );
    });

    if (sort === 'popular') {
      list = [...list].sort((a, b) => b.supportersCount - a.supportersCount);
    } else if (sort === 'newest') {
      list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else {
      list = [...list].sort((a, b) => b.totalRaised - a.totalRaised);
    }
    return list;
  }

  registerSupportStats(username: string, amount: number): void {
    const clean = username.replace(/^@/, '').toLowerCase();
    const next = this.creatorsState().map((c) =>
      c.username.toLowerCase() === clean
        ? {
            ...c,
            supportersCount: c.supportersCount + 1,
            totalRaised: c.totalRaised + amount,
          }
        : c,
    );
    this.creatorsState.set(next);
    this.saveCreators(next);
  }

  recordPostDonation(postId: string, amount: number): void {
    const next = this.postsState().map((post) => {
      if (post.id !== postId) return post;
      const nextRaised = post.raisedAmount + amount;
      const capped =
        post.kind === 'goal' && typeof post.targetAmount === 'number'
          ? Math.min(post.targetAmount, nextRaised)
          : nextRaised;
      return {
        ...post,
        raisedAmount: capped,
      };
    });
    this.postsState.set(next);
    this.savePosts(next);
  }

  upsertCreator(creator: Creator): void {
    const clean = creator.username.toLowerCase();
    const list = this.creatorsState();
    const exists = list.some((c) => c.username.toLowerCase() === clean);
    const next = exists
      ? list.map((c) => (c.username.toLowerCase() === clean ? creator : c))
      : [creator, ...list];
    this.creatorsState.set(next);
    this.saveCreators(next);
    this.ensureDefaultGeneralPost(clean, creator.displayName);
  }

  ensureDefaultGeneralPost(username: string, displayName: string): void {
    const clean = username.replace(/^@/, '').toLowerCase();
    const hasGeneral = this.postsState().some(
      (p) => p.creatorUsername.toLowerCase() === clean && p.kind === 'general',
    );
    if (hasGeneral) {
      return;
    }
    const defaultPost: CreatorPost = {
      id: `post-gen-${clean}-${Date.now()}`,
      creatorUsername: clean,
      kind: 'general',
      title: `حمایت عمومی از ${displayName}`,
      excerpt: 'حمایت آزاد و بدون سقف مبلغ برای تداوم فعالیت‌ها و انتشار محتوای مستقل.',
      content:
        'این پست برای حمایت عمومی و همیشگی بدون هیچ سقف محدودیتی ساخته شده است. می‌توانید هر مبلغ دلخواه را برای همراهی انتخاب کنید.',
      raisedAmount: 0,
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };
    const next = [defaultPost, ...this.postsState()];
    this.postsState.set(next);
    this.savePosts(next);
  }

  updateCreatorProfile(
    username: string,
    patch: Partial<
      Pick<
        Creator,
        | 'displayName'
        | 'tagline'
        | 'bio'
        | 'category'
        | 'minSupportAmount'
        | 'coverUrl'
        | 'avatarUrl'
        | 'socialLinks'
        | 'activated'
      >
    >,
  ): void {
    const clean = username.toLowerCase();
    const next = this.creatorsState().map((c) =>
      c.username.toLowerCase() === clean ? { ...c, ...patch } : c,
    );
    this.creatorsState.set(next);
    this.saveCreators(next);
  }

  addPost(input: {
    username: string;
    kind: PostKind;
    title: string;
    content: string;
    targetAmount?: number;
  }): CreatorPost {
    const cleanContent = input.content.trim();
    const post: CreatorPost = {
      id: `post-${Date.now()}`,
      creatorUsername: input.username.toLowerCase(),
      kind: input.kind,
      title: input.title.trim(),
      excerpt: cleanContent.slice(0, 110),
      content: cleanContent,
      targetAmount:
        input.kind === 'goal' && typeof input.targetAmount === 'number'
          ? Math.round(input.targetAmount)
          : undefined,
      raisedAmount: 0,
      createdAt: new Date().toISOString(),
      likesCount: 0,
    };
    const next = [post, ...this.postsState()];
    this.postsState.set(next);
    this.savePosts(next);
    return post;
  }

  deletePost(postId: string): void {
    const next = this.postsState().filter((p) => p.id !== postId);
    this.postsState.set(next);
    this.savePosts(next);
  }
}
