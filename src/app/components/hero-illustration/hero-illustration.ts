import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hero-illustration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-illustration.html',
  styleUrl: './hero-illustration.scss',
})
export class HeroIllustrationComponent {}
