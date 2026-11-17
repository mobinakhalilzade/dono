import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.LandingComponent),
  },
  {
    path: 'explore',
    loadComponent: () => import('./pages/explore/explore').then((m) => m.ExploreComponent),
  },
  {
    path: 'c/:username',
    loadComponent: () =>
      import('./pages/creator-profile/creator-profile').then((m) => m.CreatorProfileComponent),
  },
  {
    path: 'creator/:username',
    loadComponent: () =>
      import('./pages/creator-profile/creator-profile').then((m) => m.CreatorProfileComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding').then((m) => m.OnboardingComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/static/about').then((m) => m.AboutComponent),
  },
  {
    path: 'faq',
    loadComponent: () => import('./pages/static/faq').then((m) => m.FaqComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/static/contact').then((m) => m.ContactComponent),
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/static/terms').then((m) => m.TermsComponent),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/static/privacy').then((m) => m.PrivacyComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/static/not-found').then((m) => m.NotFoundComponent),
  },
];
