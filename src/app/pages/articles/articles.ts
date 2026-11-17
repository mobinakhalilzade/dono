import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import {DirectusService} from '../../directus';

@Component({
  selector: 'app-articles',
  imports: [RouterLink],
  templateUrl: './articles.html',
  styleUrl: './articles.scss',
})
export class ArticlesComponent {
  protected readonly directus = inject(DirectusService);
  protected readonly articles = toSignal(from(this.directus.getArticles()), {
    initialValue: [],
  });
}
