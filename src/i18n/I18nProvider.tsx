'use client';

// REACT
import { createContext, ReactNode, useContext } from 'react';
// I18N
import { defaultLocale, type Locale } from './config';
import en from './messages/en';
import type { Messages } from './messages';

const I18nContext = createContext<{ locale: Locale; messages: Messages }>({
  locale: defaultLocale,
  messages: en,
});

// Gives the browser components the language of the page and its texts.
// Without it, as on the page that replaces the layout when it fails, they
// are in English.
export function I18nProvider({
  locale,
  messages,
  children,
}: Readonly<{ locale: Locale; messages: Messages; children: ReactNode }>) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
