import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ACTIVITY_CATEGORIES,
  parseActivityCategoriesResponse,
  resolveCategoryLabel,
} from './activity-categories';

test('parseActivityCategoriesResponse handles Directus { data: [...] } envelope', () => {
  const parsed = parseActivityCategoriesResponse({
    data: [
      { id: 1, slug: 'podcast', title: 'پادکست و صدا' },
      { id: 2, slug: 'photography', name: 'عکاسی و هنرهای تجسمی' },
    ],
  });

  assert.deepEqual(parsed, [
    { key: 'podcast', label: 'پادکست و صدا' },
    { key: 'photography', label: 'عکاسی و هنرهای تجسمی' },
  ]);
});

test('parseActivityCategoriesResponse handles raw arrays, numeric ids, and string items', () => {
  const parsed = parseActivityCategoriesResponse([
    { id: 10, label: 'آموزش و دوره' },
    { key: 'gaming', title_fa: 'استریم و بازی' },
    'tech',
  ]);

  assert.deepEqual(parsed, [
    { key: '10', label: 'آموزش و دوره' },
    { key: 'gaming', label: 'استریم و بازی' },
    { key: 'tech', label: 'برنامه‌نویسی و فناوری' },
  ]);
});

test('parseActivityCategoriesResponse deduplicates keys and ignores invalid entries', () => {
  const parsed = parseActivityCategoriesResponse({
    categories: [
      null,
      {},
      { key: 'music', label: 'موسیقی زنده' },
      { key: 'music', label: 'تکراری' },
    ],
  });

  assert.deepEqual(parsed, [{ key: 'music', label: 'موسیقی زنده' }]);
});

test('parseActivityCategoriesResponse returns empty array for invalid payloads', () => {
  assert.deepEqual(parseActivityCategoriesResponse(null), []);
  assert.deepEqual(parseActivityCategoriesResponse({ data: 'invalid' }), []);
});

test('resolveCategoryLabel resolves dynamic and fallback category labels', () => {
  const custom = [
    ...DEFAULT_ACTIVITY_CATEGORIES,
    { key: 'photography', label: 'عکاسی' },
  ];

  assert.equal(resolveCategoryLabel('photography', custom), 'عکاسی');
  assert.equal(resolveCategoryLabel('podcast', custom), 'پادکست');
  assert.equal(resolveCategoryLabel('unknown_cat', custom), 'unknown_cat');
  assert.equal(resolveCategoryLabel(null, custom), '');
});
