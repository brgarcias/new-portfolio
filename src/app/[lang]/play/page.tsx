// NEXT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
// GAME
import GameLoader from '../../game';
// CONTENT
import { getProfile, getSections } from '@/src/content';
import { sectionIds } from '@/src/content/sections';
// I18N
import {
  defaultLocale,
  homePath,
  isLocale,
  locales,
  pagePath,
} from '@/src/i18n/config';
import { getMessages } from '@/src/i18n/messages';

// One page per language, like the home page: /play serves the English
// one, through a rewrite in next.config.mjs.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/play'>): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const { game, meta } = getMessages(locale);
  const url = pagePath(locale, 'play');
  return {
    title: game.title,
    description: game.description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(
          locales.map((code) => [code, pagePath(code, 'play')]),
        ),
        'x-default': pagePath(defaultLocale, 'play'),
      },
    },
    openGraph: {
      type: 'website',
      url,
      siteName: 'Bruno Garcia',
      title: game.title,
      description: game.description,
      locale: meta.ogLocale,
    },
  };
}

// The game, with the sections of the site as its places. It has no bar
// and no menu: this page is outside the (site) layout.
export default async function Play({ params }: PageProps<'/[lang]/play'>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const sections = getSections(lang, getProfile(lang));
  const places = sectionIds.map((id) => ({
    id,
    title: sections[id].title,
    label: sections[id].label,
  }));

  return (
    <main id="main" className="play" tabIndex={-1}>
      <GameLoader places={places} home={homePath(lang)} />
    </main>
  );
}
