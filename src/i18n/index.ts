import hy from './hy.json';
import en from './en.json';
import ru from './ru.json';

export const LANGS = ['hy', 'en', 'ru'] as const;
export type Lang = (typeof LANGS)[number];
export type Key = keyof typeof hy;

const DICTS: Record<Lang, Record<string, string>> = { hy, en, ru };

export const LANG_LABELS: Record<Lang, string> = { hy: 'ՀԱՅ', en: 'EN', ru: 'РУ' };
export const OG_LOCALE: Record<Lang, string> = { hy: 'hy_AM', en: 'en_US', ru: 'ru_RU' };

export const t = (lang: Lang, key: Key): string => DICTS[lang][key];

/** Localized URL for a root-relative route such as `/pet` or `/`. */
export function href(lang: Lang, route: string): string {
  if (lang === 'hy') return route;
  return route === '/' ? `/${lang}` : `/${lang}${route}`;
}

export const otherLangPaths = () => [{ params: { lang: 'en' } }, { params: { lang: 'ru' } }];

export const PHONE_DISPLAY = '(+374 12) 30-12-12';
export const PHONE_TEL = '+37412301212';
export const EMAIL = 'petctarmenia@gmail.com';
export const SOCIAL = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  linkedin: 'https://www.linkedin.com/',
} as const;
