// NEXT METADATA
import type { Metadata, Viewport } from 'next';
// NEXT GOOGLE FONT
import { Inter, Space_Grotesk } from 'next/font/google';
// GLOBAL CSS
import './globals.css';
// FONT AWESOME CONFIGS
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;
// COMPONENTS
import SiteFrame from '@/src/components/SiteFrame';
// PROVIDERS
import { Providers } from './providers';
// SITE
import { siteUrl } from './site';
import { applyStoredTheme, themeColors } from './theme';

const inter = Inter({ subsets: ['latin'] });
// Display font for headings, exposed as --font-display.
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const title = 'Bruno Garcia — Dev. Full-Stack';
const description = 'Bruno Garcia: An inspired Full-Stack Developer';

// On *.netlify.app, Netlify adds a line break and an HTML comment after
// <meta charset> in production. React 19 cannot hydrate that line break, a
// text node inside <head>, and would render the whole document again, so this
// script removes it while the page is still being parsed.
const removeHeadWhitespace =
  'for(const node of [...document.head.childNodes])' +
  'if(node.nodeType===3&&!node.textContent.trim())node.remove()';

// Only facts the page already shows: name, role, e-mail and profiles.
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Bruno Garcia',
  alternateName: 'Bruno Garcia da Silva',
  jobTitle: 'Full-Stack Developer',
  url: `${siteUrl}/`,
  email: 'mailto:bruno-151299@hotmail.com',
  sameAs: [
    'https://www.linkedin.com/in/bruno-garcia-9854b1161/',
    'https://github.com/brgarcias',
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Bruno Garcia',
    title,
    description,
    locale: 'en_US',
  },
  // The image comes from opengraph-image.jpg, next to this file.
  twitter: { card: 'summary_large_image', title, description },
  manifest: '/favicon/manifest.json',
  icons: [
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '192x192',
      url: '/favicon/android-icon-192x192.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '96x96',
      url: '/favicon/favicon-96x96.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon/favicon-16x16.png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '57x57',
      url: '/favicon/apple-icon-57x57.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '60x60',
      url: '/favicon/apple-icon-60x60.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '72x72',
      url: '/favicon/apple-icon-72x72.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '76x76',
      url: '/favicon/apple-icon-76x76.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '114x114',
      url: '/favicon/apple-icon-114x114.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '120x120',
      url: '/favicon/apple-icon-120x120.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '144x144',
      url: '/favicon/apple-icon-144x144.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '152x152',
      url: '/favicon/apple-icon-152x152.png',
      type: 'image/png',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      url: '/favicon/apple-icon-180x180.png',
      type: 'image/png',
    },
  ],
  authors: {
    name: 'Bruno Garcia',
    url: `${siteUrl}/`,
  },
  keywords:
    'bruno-garcia, full-stack, css, next, react, javascript, typescript, html',
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  robots: {
    index: true,
    follow: true,
  },
  description,
  // Google Search Console, URL-prefix property for the netlify.app address.
  verification: {
    google: 'zE-A_JWezHcTY0RPEAiraoj-ORR540i46tyJwSk0T3s',
  },
  other: {
    'msapplication-TileColor': '#ffffff',
    'msapplication-TileImage': '/favicon/ms-icon-144x144.png',
  },
};

export const viewport: Viewport = {
  // The theme toggle sets both to the chosen theme.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: themeColors.light },
    { media: '(prefers-color-scheme: dark)', color: themeColors.dark },
  ],
  initialScale: 1,
  width: 'device-width',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The theme script swaps the dark class before React starts, which is
    // why the class on <html> may differ from the server's.
    <html
      lang="en"
      className={`dark ${display.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: removeHeadWhitespace }} />
        <script dangerouslySetInnerHTML={{ __html: applyStoredTheme }} />
        <script
          type="application/ld+json"
          // Escapes "<" so the JSON can never close the script element.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd).replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <SiteFrame year={new Date().getUTCFullYear()}>{children}</SiteFrame>
        </Providers>
      </body>
    </html>
  );
}
