import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n';

const files = import.meta.glob('/src/content/*/*.json', { eager: true, import: 'default' }) as Record<string, any[]>;
const images = import.meta.glob('/src/assets/media/**/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' }) as Record<string, ImageMetadata>;

/**
 * Rows of a table for a language. Russian content files are added in the
 * translation step; until a table has one, Russian falls back to English.
 */
export function table<T = any>(lang: Lang, name: string): T[] {
  return (files[`/src/content/${lang}/${name}.json`] ?? files[`/src/content/en/${name}.json`] ?? []) as T[];
}

export const shared = <T = any>(name: string): T[] => (files[`/src/content/shared/${name}.json`] ?? []) as T[];

export function media(rel: string): ImageMetadata {
  const img = images[`/src/assets/media/${rel}`];
  if (!img) throw new Error(`Missing media file: ${rel}`);
  return img;
}
