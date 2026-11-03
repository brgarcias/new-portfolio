'use client'; // Error boundaries must be Client Components

// NEXT GOOGLE FONT
import { Bricolage_Grotesque, Inter } from 'next/font/google';
// HOOKS
import { useSyncExternalStore } from 'react';
// GLOBAL CSS
import './globals.css';
// COMPONENTS
import ErrorPage from '@/src/components/StatusPage/ErrorPage';
// THEME
import { currentTheme, type Theme } from './theme';

const inter = Inter({ subsets: ['latin'] });
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
});

const subscribe = () => () => {};
const serverTheme = (): Theme => 'dark';

// Replaces the root layout when it fails, so it brings its own <html> and
// <body> with the same classes and fonts as the layout. It keeps the theme
// the page was in, which the layout's script set on <html>.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme);
  return (
    <html lang="en" className={`${theme} ${display.variable}`}>
      <body className={inter.className}>
        <ErrorPage error={error} />
      </body>
    </html>
  );
}
