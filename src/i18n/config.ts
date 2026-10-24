// Languages of the site. English is the default and has no prefix in the
// address; each other language has its own, such as /pt.
export const locales = ['en', 'pt', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

// The address of the home page in each language.
export const homePath = (locale: Locale) =>
  locale === defaultLocale ? '/' : `/${locale}`;
