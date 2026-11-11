import { Component, inject, input, resource } from '@angular/core';
import {DirectusService} from '../../directus';

@Component({
  selector: 'app-article-detail',
  template: `
    @if (article.value(); as a) {
      <h1>{{ a.title }}</h1>
      <div [innerHTML]="a.content"></div>
    }
  `,
})
export class ArticleDetailComponent {
  private readonly directus = inject(DirectusService);
  readonly slug = input.required<string>();

  protected readonly article = resource({
    params: () => this.slug(),
    loader: ({ params }) => this.directus.getBySlug(params),
  });
}
