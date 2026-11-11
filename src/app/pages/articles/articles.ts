import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import {DirectusService} from '../../directus';

@Component({
  selector: 'app-articles',
  imports: [RouterLink],
  template: `
    @for (a of articles(); track a.id) {
      <article>
        @if (a.cover) {
          <img [src]="directus.imageUrl(a.cover, 600)" [alt]="a.title" />
        }
        <h2><a [routerLink]="['/articles', a.slug]">{{ a.title }}</a></h2>
      </article>
    } @empty {
      <p>No articles yet.</p>
    }
  `,
})
export class ArticlesComponent {
  protected readonly directus = inject(DirectusService);
  protected readonly articles = toSignal(from(this.directus.getArticles()), {
    initialValue: [],
  });
}
