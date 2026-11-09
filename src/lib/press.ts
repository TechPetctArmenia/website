import type { Lang } from '../i18n';
import { table } from './content';

/** Stable slugs per article, with the database row id for each language. */
const ARTICLES = [
  { slug: 'first-pet-ct-in-armenia', hy: 8, en: 10 },
  { slug: 'expert-opinion-kentron-tv', hy: 11, en: null },
] as const;

export const PRESS_SLUGS = ARTICLES.map((a) => a.slug);

/** Articles for a language; an article without a translation yet uses the Armenian row. */
export function pressArticles(lang: Lang) {
  const hy = table('hy', 'presses');
  const en = table('en', 'presses');
  return ARTICLES.map((a) => {
    const row = (lang !== 'hy' && en.find((r) => r.id === a.en)) || hy.find((r) => r.id === a.hy);
    return { ...row, slug: a.slug };
  });
}
