import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Creator } from '../../models/dono.models';
import { ActivityCategoriesService } from '../../services/activity-categories.service';
import { formatNumberFa, formatToman } from '../../utils/formatters';
import { AppIcon } from '../icon/icon';

@Component({
  selector: 'app-creator-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon],
  templateUrl: './creator-card.html',
  styleUrl: './creator-card.scss',
})
export class CreatorCard {
  private readonly activityCategoriesService = inject(ActivityCategoriesService);

  readonly creator = input.required<Creator>();
  protected readonly coverFailed = signal(false);
  protected readonly avatarFailed = signal(false);

  protected readonly categoryLabel = computed(() =>
    this.activityCategoriesService.getLabel(this.creator().category),
  );
  protected readonly initials = computed(() => this.creator().displayName.trim().slice(0, 1));
  protected readonly formatToman = formatToman;
  protected readonly formatNumberFa = formatNumberFa;
}
