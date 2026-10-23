'use client'; // Error boundaries must be Client Components

// NEXT GOOGLE FONT
import { Inter } from 'next/font/google';
// GLOBAL CSS
import './globals.css';
// FONT AWESOME CONFIGS
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;
// COMPONENTS
import ErrorPage from './error';

const inter = Inter({ subsets: ['latin'] });

// Replaces the root layout when it fails, so it brings its own <html> and
// <body> with the same classes and font as the layout.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en" className="js csstransitions dark">
      <body className={inter.className}>
        <ErrorPage error={error} />
      </body>
    </html>
  );
}
