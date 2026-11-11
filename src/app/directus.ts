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

@Injectable({ providedIn: 'root' })
export class DirectusService {
  private readonly url = environment.directusUrl;
  private readonly client = createDirectus<Schema>(this.url).with(rest());

  getArticles() {
    return this.client.request(
      readItems('articles', {
        sort: ['-id'],
      })
    );
  }

  async getBySlug(slug: string) {
    const [article] = await this.client.request(
      readItems('articles', { filter: { slug: { _eq: slug } }, limit: 1 })
    );
    return article;
  }

  imageUrl(id: string, width = 800) {
    return `${this.url}/assets/${id}?width=${width}&format=webp`;
  }
}
