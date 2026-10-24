import type { MetadataRoute } from 'next';
import { siteUrl } from './site';
// I18N
import { defaultLocale, homePath, locales } from '@/src/i18n/config';

// The home page in each language, each listing the others.
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    locales.map((code) => [code, `${siteUrl}${homePath(code)}`]),
  );
  return locales.map((code) => ({
    url: `${siteUrl}${homePath(code)}`,
    changeFrequency: 'monthly',
    priority: code === defaultLocale ? 1 : 0.9,
    alternates: { languages },
  }));
}
