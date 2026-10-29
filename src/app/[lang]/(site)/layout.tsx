// COMPONENTS
import SiteFrame from '@/src/components/SiteFrame';
// CONTENT
import { getProfile, getSections, getSocialLinks } from '@/src/content';
import { sectionIds } from '@/src/content/sections';
// I18N
import { defaultLocale, isLocale, type Locale } from '@/src/i18n/config';
import { getMessages } from '@/src/i18n/messages';

const localeOf = (lang: string): Locale =>
  isLocale(lang) ? lang : defaultLocale;

// The frame of the site's pages: the bar and the stacked-pages menu around
// the home page. The game, in [lang]/play, has no frame, which is why this
// layout is apart from the one of the languages. The 404 of
// src/app/not-found.tsx renders it too, in the default language.
export default async function SiteLayout({
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
    <SiteFrame
      nav={nav}
      social={getSocialLinks(profile, getMessages(locale))}
      name={profile.name}
      role={profile.role}
      year={new Date().getUTCFullYear()}
    >
      {children}
    </SiteFrame>
  );
}
