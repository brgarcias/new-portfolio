'use client'; // Error boundaries must be Client Components

// NEXT GOOGLE FONT
import { Inter, Space_Grotesk } from 'next/font/google';
// GLOBAL CSS
import './globals.css';
// FONT AWESOME CONFIGS
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;
// COMPONENTS
import ErrorPage from './error';

const inter = Inter({ subsets: ['latin'] });
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

// Replaces the root layout when it fails, so it brings its own <html> and
// <body> with the same classes and fonts as the layout.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en" className={`dark ${display.variable}`}>
      <body className={inter.className}>
        <ErrorPage error={error} />
      </body>
    </html>
  );
}
