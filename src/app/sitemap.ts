import type { MetadataRoute } from 'next';
import { siteUrl } from './site';
// I18N
import { defaultLocale, homePath, locales, pagePath } from '@/src/i18n/config';

// The home page and the game in each language, each listing the others.
export default function sitemap(): MetadataRoute.Sitemap {
  const homes = Object.fromEntries(
    locales.map((code) => [code, `${siteUrl}${homePath(code)}`]),
  );
  const games = Object.fromEntries(
    locales.map((code) => [code, `${siteUrl}${pagePath(code, 'play')}`]),
  );
  return [
    ...locales.map((code) => ({
      url: `${siteUrl}${homePath(code)}`,
      changeFrequency: 'monthly' as const,
      priority: code === defaultLocale ? 1 : 0.9,
      alternates: { languages: homes },
    })),
    ...locales.map((code) => ({
      url: `${siteUrl}${pagePath(code, 'play')}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: { languages: games },
    })),
  ];
}
