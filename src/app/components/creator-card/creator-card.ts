import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORY_LABELS, Creator } from '../../models/dono.models';
import { formatNumberFa, formatToman } from '../../utils/formatters';
import { AppIcon } from '../icon/icon';

@Component({
  selector: 'app-creator-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon],
  template: `
    <a [routerLink]="['/c', creator().username]" class="creator-card surface-card">
      <div class="cover-wrap">
        @if (!coverFailed()) {
          <img
            [src]="creator().coverUrl"
            [alt]="creator().displayName"
            referrerpolicy="no-referrer"
            class="cover-img"
            (error)="coverFailed.set(true)"
          />
        } @else {
          <div class="cover-fallback" aria-hidden="true"></div>
        }
      </div>

      <div class="card-body">
        <div class="avatar-row">
          <div class="avatar-wrap">
            @if (!avatarFailed()) {
              <img
                [src]="creator().avatarUrl"
                [alt]="creator().displayName"
                referrerpolicy="no-referrer"
                class="avatar-img"
                (error)="avatarFailed.set(true)"
              />
            } @else {
              <span class="avatar-fallback">{{ initials() }}</span>
            }
          </div>
          <span class="support-rate tabular-nums">
            حمایت از {{ formatToman(creator().minSupportAmount) }}
          </span>
        </div>

        <div class="title-row">
          <h3 class="creator-name">{{ creator().displayName }}</h3>
          @if (creator().verified) {
            <span class="verified-icon" title="تایید شده">
              <app-icon name="verified" [size]="16" />
            </span>
          }
        </div>

        <div class="meta-row">
          <span>{{ categoryLabel() }}</span>
          <span aria-hidden="true">·</span>
          <span class="tabular-nums">{{ formatNumberFa(creator().supportersCount) }} حامی</span>
        </div>

        <p class="creator-tagline">{{ creator().tagline }}</p>
      </div>
    </a>
  `,
  styles: `
    .creator-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition:
        border-color var(--transition-fast),
        box-shadow 240ms cubic-bezier(0.16, 1, 0.3, 1),
        transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .creator-card:hover {
      border-color: var(--accent-border);
      transform: translateY(-4px);
      box-shadow: 0 18px 34px -20px rgba(15, 20, 16, 0.25);
    }

    .cover-wrap {
      aspect-ratio: 16 / 9;
      background-color: var(--bg-subtle);
      overflow: hidden;
    }

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .creator-card:hover .cover-img {
      transform: scale(1.045);
    }

    .cover-fallback {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--accent-soft), var(--bg-subtle));
    }

    .card-body {
      padding: 1.125rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      flex: 1;
    }

    .avatar-row {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem;
      margin-block-start: -2.25rem;
      margin-block-end: 0.25rem;
    }

    .avatar-wrap {
      inline-size: 56px;
      block-size: 56px;
      border-radius: 14px;
      border: 3px solid var(--bg-surface);
      background-color: var(--bg-subtle);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-fallback {
      font-weight: 800;
      font-size: 1.1rem;
      color: var(--text-primary);
    }

    .support-rate {
      padding: 0.2rem 0.55rem;
      border-radius: 8px;
      background-color: var(--secondary-accent-soft);
      color: var(--secondary-accent-ink);
      font-size: 0.8rem;
      font-weight: 700;
      white-space: nowrap;
      transition: transform var(--transition-fast);
    }

    .creator-card:hover .support-rate {
      transform: translateY(-1px);
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .creator-name {
      margin: 0;
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .verified-icon {
      color: var(--secondary-accent-ink);
      display: inline-flex;
      transition: transform var(--transition-fast);
    }

    .creator-card:hover .verified-icon {
      transform: scale(1.12);
    }

    .creator-tagline {
      margin: 0.2rem 0 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `,
})
export class CreatorCard {
  readonly creator = input.required<Creator>();
  protected readonly coverFailed = signal(false);
  protected readonly avatarFailed = signal(false);

  protected readonly categoryLabel = computed(() => CATEGORY_LABELS[this.creator().category]);
  protected readonly initials = computed(() => this.creator().displayName.trim().slice(0, 1));
  protected readonly formatToman = formatToman;
  protected readonly formatNumberFa = formatNumberFa;
}
