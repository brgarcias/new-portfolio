// NEXT METADATA
import type { Metadata } from 'next';
// NEXT GOOGLE FONT
import { Inter, Space_Grotesk } from 'next/font/google';
// GLOBAL CSS
import '../globals.css';
// FONT AWESOME CONFIGS
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;
// COMPONENTS
import SiteFrame from '@/src/components/SiteFrame';
// PROVIDERS
import { Providers } from '../providers';
// SITE
import { siteUrl } from '../site';
import { applyStoredTheme } from '../theme';
// CONTENT
import {
  getProfile,
  getSections,
  getSocialLinks,
  type Profile,
} from '@/src/content';
import { sectionIds } from '@/src/content/sections';
// I18N
import {
  defaultLocale,
  homePath,
  isLocale,
  type Locale,
} from '@/src/i18n/config';
import { getMessages } from '@/src/i18n/messages';
import { I18nProvider } from '@/src/i18n/I18nProvider';

const inter = Inter({ subsets: ['latin'] });
// Display font for headings, exposed as --font-display.
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

// The layout of every page, in its language. The 404 of src/app/not-found.tsx
// also renders it, in the default language.
const localeOf = (lang: string): Locale =>
  isLocale(lang) ? lang : defaultLocale;

// On *.netlify.app, Netlify adds a line break and an HTML comment after
// <meta charset> in production. React 19 cannot hydrate that line break, a
// text node inside <head>, and would render the whole document again, so this
// script removes it while the page is still being parsed.
const removeHeadWhitespace =
  'for(const node of [...document.head.childNodes])' +
  'if(node.nodeType===3&&!node.textContent.trim())node.remove()';

// Only facts the page already shows: name, role, e-mail and profiles.
const personJsonLd = (profile: Profile) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  alternateName: profile.fullName,
  jobTitle: profile.role,
  url: `${siteUrl}/`,
  email: `mailto:${profile.email}`,
  sameAs: [profile.linkedin, profile.github],
});

export async function generateMetadata({
  params,
}: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const locale = localeOf((await params).lang);
  const { title, description, ogLocale } = getMessages(locale).meta;
  const home = homePath(locale);
  return {
    alternates: { canonical: home },
    openGraph: {
      type: 'website',
      url: home,
      siteName: 'Bruno Garcia',
      title,
      description,
      locale: ogLocale,
    },
    // The image comes from src/app/opengraph-image.jpg.
    twitter: { card: 'summary_large_image', title, description },
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const locale = localeOf((await params).lang);
  const profile = getProfile(locale);
  const sections = getSections(locale, profile);
  const nav = sectionIds.map((id) => {
    const { label, title } = sections[id];
    return { id, label, title };
  });

  return (
    // The theme script swaps the dark class before React starts, which is
    // why the class on <html> may differ from the server's.
    <html
      lang={locale}
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
            __html: JSON.stringify(personJsonLd(profile)).replace(
              /</g,
              '\\u003c',
            ),
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <I18nProvider locale={locale} messages={getMessages(locale)}>
            <SiteFrame
              nav={nav}
              social={getSocialLinks(profile, getMessages(locale))}
              name={profile.name}
              role={profile.role}
              year={new Date().getUTCFullYear()}
            >
              {children}
            </SiteFrame>
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
