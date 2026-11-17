import { CATEGORY_LABELS, CreatorCategory } from '../models/dono.models';

export interface ActivityCategoryOption {
  key: CreatorCategory;
  label: string;
}

export const DEFAULT_ACTIVITY_CATEGORIES: readonly ActivityCategoryOption[] = Object.keys(
  CATEGORY_LABELS,
).map((key) => ({
  key,
  label: CATEGORY_LABELS[key],
}));

function pickFirstNonEmptyString(
  record: Record<string, unknown>,
  fields: readonly string[],
): string | null {
  for (const field of fields) {
    const raw = record[field];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim();
    }
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return String(raw);
    }
  }
  return null;
}

function extractRawArray(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const obj = payload as Record<string, unknown>;
  for (const key of ['data', 'items', 'categories', 'results']) {
    if (Array.isArray(obj[key])) {
      return obj[key] as unknown[];
    }
  }
  return null;
}

export function parseActivityCategoriesResponse(payload: unknown): ActivityCategoryOption[] {
  const list = extractRawArray(payload);
  if (!list) {
    return [];
  }

  const seen = new Set<string>();
  const result: ActivityCategoryOption[] = [];

  for (const entry of list) {
    if (typeof entry === 'string') {
      const clean = entry.trim();
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);
      result.push({
        key: clean,
        label: CATEGORY_LABELS[clean] ?? clean,
      });
      continue;
    }

    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const record = entry as Record<string, unknown>;
    const key = pickFirstNonEmptyString(record, ['slug', 'key', 'code', 'value', 'id']);
    if (!key || seen.has(key)) {
      continue;
    }

    const label =
      pickFirstNonEmptyString(record, [
        'label',
        'title_fa',
        'name_fa',
        'title',
        'name',
        'display_name',
        'displayName',
      ]) ??
      CATEGORY_LABELS[key] ??
      key;

    seen.add(key);
    result.push({ key, label });
  }

  return result;
}

export function resolveCategoryLabel(
  key: string | undefined | null,
  categories: readonly ActivityCategoryOption[],
): string {
  if (!key) return '';
  const match = categories.find((cat) => cat.key === key);
  if (match) return match.label;
  return CATEGORY_LABELS[key] ?? key;
}
