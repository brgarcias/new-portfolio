// Languages of the site. English is the default and has no prefix in the
// address; the others have their own, such as /pt.
export const locales = ['en', 'pt', 'es'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
