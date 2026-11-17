import { Injectable } from '@angular/core';
import { createDirectus, rest, readItems } from '@directus/sdk';
import { environment } from '../environments/environment';

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  cover: string | null;
  status: 'draft' | 'published';
}

interface Schema {
  articles: Article[];
}

const FALLBACK_ARTICLES: Article[] = [
  {
    id: 1,
    title: 'Welcome to Dono',
    slug: 'welcome-to-dono',
    content:
      '<p>Connect a live Directus CMS instance to manage and publish articles dynamically. Showing fallback sample content while Directus is offline.</p>',
    cover: null,
    status: 'published',
  },
  {
    id: 2,
    title: 'Personal Finance Basics',
    slug: 'personal-finance-basics',
    content:
      '<p>Track income, build an emergency reserve, and allocate long-term investments consistently over time.</p>',
    cover: null,
    status: 'published',
  },
];

@Injectable({ providedIn: 'root' })
export class DirectusService {
  private readonly url = environment.directusUrl;
  private readonly client = createDirectus<Schema>(this.url).with(rest());

  async getArticles(): Promise<Article[]> {
    try {
      return await this.client.request(
        readItems('articles', {
          sort: ['-id'],
        })
      );
    } catch {
      return FALLBACK_ARTICLES;
    }
  }

  async getBySlug(slug: string): Promise<Article | undefined> {
    try {
      const [article] = await this.client.request(
        readItems('articles', { filter: { slug: { _eq: slug } }, limit: 1 })
      );
      return article;
    } catch {
      return FALLBACK_ARTICLES.find((a) => a.slug === slug);
    }
  }

  imageUrl(id: string, width = 800) {
    return `${this.url}/assets/${id}?width=${width}&format=webp`;
  }
}
