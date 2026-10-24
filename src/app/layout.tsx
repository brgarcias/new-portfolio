// NEXT METADATA
import type { Metadata, Viewport } from 'next';
// SITE
import { siteUrl } from './site';
import { themeColors } from './theme';

const icons: Metadata['icons'] = [
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
];

// What every page shares, in any language. The title, the description and
// the sharing tags come from [lang]/layout.tsx, in the page's language.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  manifest: '/favicon/manifest.json',
  icons,
  authors: {
    name: 'Bruno Garcia',
    url: `${siteUrl}/`,
  },
  keywords:
    'bruno-garcia, full-stack, css, next, react, javascript, typescript, html',
  robots: {
    index: true,
    follow: true,
  },
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

// The layout that renders <html>, in the page's language, is
// [lang]/layout.tsx. This one only passes the page through, so the 404 of
// not-found.tsx, next to it, can render that layout too.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
