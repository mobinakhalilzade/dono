import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MOCK_EARNINGS, MOCK_PAYOUTS, MOCK_SUPPORTERS } from '../data/mock-data';
import {
  MonthlyEarning,
  PayoutRecord,
  SupporterMessage,
  SupportRequestPayload,
} from '../models/dono.models';
import { CreatorService } from './creator.service';

const SUPPORTERS_STORAGE_KEY = 'dono_supporters_v1';
const SHOP_DEBITS_STORAGE_KEY = 'dono_shop_debits_v1';

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly creatorService = inject(CreatorService);

  private readonly supportersState = signal<SupporterMessage[]>(this.loadInitialSupporters());
  private readonly payoutsState = signal<PayoutRecord[]>([...MOCK_PAYOUTS]);
  private readonly earningsState = signal<MonthlyEarning[]>([...MOCK_EARNINGS]);
  private readonly shopDebitsState = signal<Record<string, number>>(this.loadInitialShopDebits());

  readonly supporters = this.supportersState.asReadonly();
  readonly payouts = this.payoutsState.asReadonly();
  readonly earnings = this.earningsState.asReadonly();

  private loadInitialSupporters(): SupporterMessage[] {
    if (!isPlatformBrowser(this.platformId)) {
      return [...MOCK_SUPPORTERS];
    }
    try {
      const raw = localStorage.getItem(SUPPORTERS_STORAGE_KEY);
      if (!raw) return [...MOCK_SUPPORTERS];
      const parsed = JSON.parse(raw) as SupporterMessage[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_SUPPORTERS];
    } catch {
      return [...MOCK_SUPPORTERS];
    }
  }

  private saveSupporters(list: SupporterMessage[]): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(SUPPORTERS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore storage errors
    }
  }

  private loadInitialShopDebits(): Record<string, number> {
    if (!isPlatformBrowser(this.platformId)) return {};
    try {
      const raw = localStorage.getItem(SHOP_DEBITS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, number>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private saveShopDebits(map: Record<string, number>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(SHOP_DEBITS_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // Ignore storage errors
    }
  }

  getSupportersByCreator(username: string): SupporterMessage[] {
    const clean = username.replace(/^@/, '').toLowerCase();
    return this.supportersState().filter((s) => s.creatorUsername.toLowerCase() === clean);
  }

  getPayoutsByCreator(username: string): PayoutRecord[] {
    const clean = username.replace(/^@/, '').toLowerCase();
    return this.payoutsState().filter((p) => p.creatorUsername.toLowerCase() === clean);
  }

  getEarningsByCreator(username: string): MonthlyEarning[] {
    const clean = username.replace(/^@/, '').toLowerCase();
    const creator = this.creatorService
      .creators()
      .find((c) => c.username.toLowerCase() === clean);
    if (!creator || creator.totalRaised === 0) {
      return [
        { monthLabel: 'خرداد', amount: 0, supporters: 0 },
        { monthLabel: 'تیر', amount: 0, supporters: 0 },
        { monthLabel: 'مرداد', amount: 0, supporters: 0 },
        { monthLabel: 'شهریور', amount: 0, supporters: 0 },
        { monthLabel: 'مهر', amount: 0, supporters: 0 },
        { monthLabel: 'آبان', amount: 0, supporters: 0 },
      ];
    }
    return this.earningsState();
  }

  getAvailableBalance(username: string): number {
    const clean = username.replace(/^@/, '').toLowerCase();
    const creator = this.creatorService
      .creators()
      .find((c) => c.username.toLowerCase() === clean);
    if (!creator) {
      return 0;
    }
    const totalPaidOrPending = this.getPayoutsByCreator(clean).reduce((sum, p) => sum + p.amount, 0);
    const shopDebits = this.shopDebitsState()[clean] ?? 0;
    return Math.max(0, creator.totalRaised - totalPaidOrPending - shopDebits);
  }

  recordShopDebit(username: string, amount: number): void {
    if (amount <= 0) return;
    const clean = username.replace(/^@/, '').toLowerCase();
    const current = this.shopDebitsState();
    const next = {
      ...current,
      [clean]: (current[clean] ?? 0) + amount,
    };
    this.shopDebitsState.set(next);
    this.saveShopDebits(next);
  }

  async createSupport(payload: SupportRequestPayload): Promise<SupporterMessage> {
    const cleanUsername = payload.creatorUsername.replace(/^@/, '').toLowerCase();
    const record: SupporterMessage = {
      id: `sup-${Date.now()}`,
      creatorUsername: cleanUsername,
      supporterName: payload.isAnonymous ? 'حامی ناشناس' : payload.supporterName.trim(),
      isAnonymous: payload.isAnonymous,
      amount: payload.amount,
      message: payload.message.trim(),
      postId: payload.postId,
      postTitle: payload.postTitle,
      createdAt: new Date().toISOString(),
    };

    const nextSupporters = [record, ...this.supportersState()];
    this.supportersState.set(nextSupporters);
    this.saveSupporters(nextSupporters);

    this.creatorService.registerSupportStats(cleanUsername, payload.amount);
    if (payload.postId) {
      this.creatorService.recordPostDonation(payload.postId, payload.amount);
    }

    this.earningsState.update((months) => {
      if (months.length === 0) return months;
      const lastIndex = months.length - 1;
      return months.map((m, idx) =>
        idx === lastIndex
          ? { ...m, amount: m.amount + payload.amount, supporters: m.supporters + 1 }
          : m,
      );
    });

    return record;
  }

  async requestPayout(username: string, amount: number, sheba: string): Promise<PayoutRecord> {
    const normalized = sheba.replace(/\s+/g, '').toUpperCase();
    const masked = `${normalized.slice(0, 4)} •••• •••• •••• ${normalized.slice(-4)}`;
    const payout: PayoutRecord = {
      id: `pay-${Date.now()}`,
      creatorUsername: username.toLowerCase(),
      amount,
      ibanMasked: masked,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.payoutsState.update((list) => [payout, ...list]);
    return payout;
  }
}
