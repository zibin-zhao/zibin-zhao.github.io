import catalog from '../../tools/past-designs.json' with { type: 'json' };
import type { Lang } from '../lib/i18n';

export const pastDesigns = catalog.map((entry, index) => ({
  id: entry.id,
  number: index + 1,
  date: entry.date,
  title: entry.title,
  note: entry.note,
  hasChineseRoutes: entry.runtime === 'modern',
}));

export type PastDesign = (typeof pastDesigns)[number];
export const pastPath = (id: string, lang: Lang) => `${lang === 'zh' ? '/zh' : ''}/past/${id}/`;
export const replayPath = (entry: PastDesign, lang: Lang) =>
  `/past-designs/${entry.id}/${lang === 'zh' && entry.hasChineseRoutes ? 'zh/' : ''}index.html`;
