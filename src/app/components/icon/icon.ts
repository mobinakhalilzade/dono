import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'brand'
  | 'search'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'close'
  | 'check'
  | 'verified'
  | 'alert'
  | 'arrow-left'
  | 'heart'
  | 'share'
  | 'copy'
  | 'download'
  | 'qrcode'
  | 'edit'
  | 'chart'
  | 'wallet'
  | 'users'
  | 'settings'
  | 'globe'
  | 'external'
  | 'plus'
  | 'logout'
  | 'lock'
  | 'chevron-down'
  | 'x'
  | 'instagram'
  | 'linkedin'
  | 'telegram'
  | 'whatsapp'
  | 'target'
  | 'trash'
  | 'sparkles'
  | 'trophy'
  | 'play'
  | 'flame'
  | 'eye'
  | 'eye-off'
  | 'shield'
  | 'calendar'
  | 'image'
  | 'upload';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class AppIcon {
  readonly name = input.required<IconName>();
  readonly size = input<number>(18);
}
