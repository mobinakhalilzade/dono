import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CreatorAnimationConfig,
  ThankYouAnimationId,
  ThankYouAnimationPack,
} from '../models/dono.models';
import {
  activateAnimationForConfig,
  getAnimationPackById,
  purchaseAnimationForConfig,
  validateThankYouNote,
} from '../utils/thank-you-animations';
import { SupportService } from './support.service';

const ANIM_STORAGE_KEY = 'dono_thank_you_anims_v1';

const INITIAL_ANIM_CONFIGS: Record<string, CreatorAnimationConfig> = {
  ali_code: {
    creatorUsername: 'ali_code',
    ownedIds: ['standard', 'confetti-celebration'],
    activeId: 'confetti-celebration',
    thankYouNote: 'دمت گرم رفیق! حمایت تو مستقیم صرف ضبط اپیزود بعدی و ابزارهای متن‌باز می‌شه.',
  },
  avaye_tehran: {
    creatorUsername: 'avaye_tehran',
    ownedIds: ['standard', 'coral-hearts'],
    activeId: 'coral-hearts',
    thankYouNote: 'از صمیم قلب سپاسگزاریم که صدای تاریخ محله‌های تهران را زنده نگه می‌دارید.',
  },
  frame_cinema: {
    creatorUsername: 'frame_cinema',
    ownedIds: ['standard', 'fireworks-gala'],
    activeId: 'fireworks-gala',
    thankYouNote: 'حضور شما مثل نور پروژکتور روی پرده استودیو فریم می‌درخشد!',
  },
};

@Injectable({ providedIn: 'root' })
export class AnimationStoreService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly supportService = inject(SupportService);
  private readonly configsState = signal<Record<string, CreatorAnimationConfig>>(
    this.loadInitialConfigs(),
  );

  readonly configs = this.configsState.asReadonly();

  private loadInitialConfigs(): Record<string, CreatorAnimationConfig> {
    if (!isPlatformBrowser(this.platformId)) {
      return { ...INITIAL_ANIM_CONFIGS };
    }
    try {
      const raw = localStorage.getItem(ANIM_STORAGE_KEY);
      if (!raw) return { ...INITIAL_ANIM_CONFIGS };
      const parsed = JSON.parse(raw) as Record<string, CreatorAnimationConfig>;
      if (!parsed || typeof parsed !== 'object') {
        return { ...INITIAL_ANIM_CONFIGS };
      }
      return { ...INITIAL_ANIM_CONFIGS, ...parsed };
    } catch {
      return { ...INITIAL_ANIM_CONFIGS };
    }
  }

  private saveConfigs(map: Record<string, CreatorAnimationConfig>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(ANIM_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // Ignore storage errors
    }
  }

  getCreatorConfig(username: string): CreatorAnimationConfig {
    const clean = username.replace(/^@/, '').toLowerCase();
    return (
      this.configsState()[clean] ?? {
        creatorUsername: clean,
        ownedIds: ['standard'],
        activeId: 'standard',
        thankYouNote: '',
      }
    );
  }

  getActiveAnimation(username: string): ThankYouAnimationPack {
    const cfg = this.getCreatorConfig(username);
    return getAnimationPackById(cfg.activeId);
  }

  purchaseAnimation(
    username: string,
    animationId: ThankYouAnimationId,
    paymentSource: 'balance' | 'direct',
  ): { ok: boolean; error?: string } {
    const clean = username.replace(/^@/, '').toLowerCase();
    const current = this.getCreatorConfig(clean);
    const availableBalance = this.supportService.getAvailableBalance(clean);

    const res = purchaseAnimationForConfig(current, animationId, availableBalance, paymentSource);
    if (!res.ok || !res.updatedConfig) {
      return { ok: false, error: res.error };
    }

    if (res.spentFromBalance && res.spentFromBalance > 0) {
      this.supportService.recordShopDebit(clean, res.spentFromBalance);
    }

    const next = {
      ...this.configsState(),
      [clean]: res.updatedConfig,
    };
    this.configsState.set(next);
    this.saveConfigs(next);
    return { ok: true };
  }

  activateAnimation(username: string, animationId: ThankYouAnimationId): { ok: boolean; error?: string } {
    const clean = username.replace(/^@/, '').toLowerCase();
    const current = this.getCreatorConfig(clean);
    const res = activateAnimationForConfig(current, animationId);
    if (!res.ok || !res.updatedConfig) {
      return { ok: false, error: res.error };
    }

    const next = {
      ...this.configsState(),
      [clean]: res.updatedConfig,
    };
    this.configsState.set(next);
    this.saveConfigs(next);
    return { ok: true };
  }

  updateThankYouNote(username: string, note: string): { ok: boolean; error?: string } {
    const clean = username.replace(/^@/, '').toLowerCase();
    const validation = validateThankYouNote(note);
    if (!validation.valid) {
      return { ok: false, error: validation.error };
    }

    const current = this.getCreatorConfig(clean);
    const next = {
      ...this.configsState(),
      [clean]: {
        ...current,
        thankYouNote: validation.cleaned,
      },
    };
    this.configsState.set(next);
    this.saveConfigs(next);
    return { ok: true };
  }
}
