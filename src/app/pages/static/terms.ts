import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './terms.html',
  styleUrl: './terms.scss',
})
export class TermsComponent {}
