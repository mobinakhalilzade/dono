import { Routes } from '@angular/router';
import {ArticlesComponent} from './pages/articles/articles';
import {ArticleDetailComponent} from './pages/article-detail/article-detail';

export const routes: Routes = [
  { path: 'articles', component: ArticlesComponent },
  { path: 'articles/:slug', component: ArticleDetailComponent },
  { path: '', redirectTo: 'articles', pathMatch: 'full' },
];
