import { Component, inject, input, resource } from '@angular/core';
import {DirectusService} from '../../directus';

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.scss',
})
export class ArticleDetailComponent {
  private readonly directus = inject(DirectusService);
  readonly slug = input.required<string>();

  protected readonly article = resource({
    params: () => this.slug(),
    loader: ({ params }) => this.directus.getBySlug(params),
  });
}
