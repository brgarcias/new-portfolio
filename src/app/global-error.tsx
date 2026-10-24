'use client'; // Error boundaries must be Client Components

// NEXT GOOGLE FONT
import { Inter, Space_Grotesk } from 'next/font/google';
// HOOKS
import { useSyncExternalStore } from 'react';
// GLOBAL CSS
import './globals.css';
// FONT AWESOME CONFIGS
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;
// COMPONENTS
import ErrorPage from './error';
// THEME
import { currentTheme, type Theme } from './theme';

const inter = Inter({ subsets: ['latin'] });
const display = Space_Grotesk({
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
