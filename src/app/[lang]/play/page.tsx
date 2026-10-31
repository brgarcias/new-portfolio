// NEXT
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
// GAME
import GameLoader from '../../game';
// SECTIONS
import About from '../../about-me/About';
import ProfessionalExperience from '../../professional-experience';
import AcademicEducation from '../../academic-education';
import Courses from '../../courses';
import Projects from '../../projects';
import Contributing from '../../contributing';
import Contact from '../../contact';
// CONTENT
import {
  getAbout,
  getContactCards,
  getContributing,
  getCourses,
  getEducation,
  getExperiences,
  getHolocrons,
  getInitiatives,
  getProfile,
  getProjects,
  getSections,
  getSocialLinks,
} from '@/src/content';
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

// The sections show the current role's duration and the age, as the home
// page does, so this page is regenerated once a day too.
export const revalidate = 86400;

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

// The game, with the sections of the site as its places: landing on a pad
// opens that section, the same one the home page shows. It has no bar and
// no menu: this page is outside the (site) layout.
export default async function Play({ params }: PageProps<'/[lang]/play'>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const messages = getMessages(lang);
  const profile = getProfile(lang);
  const social = getSocialLinks(profile, messages);
  const sections = getSections(lang, profile);
  const places = sectionIds.map((id) => ({
    id,
    title: sections[id].title,
    label: sections[id].label,
  }));
  const panels = {
    about: <About header={sections.about} about={getAbout(lang)} />,
    experience: (
      <ProfessionalExperience
        header={sections.experience}
        experiences={getExperiences(lang, messages)}
      />
    ),
    education: (
      <AcademicEducation
        header={sections.education}
        steps={getEducation(lang)}
      />
    ),
    courses: <Courses header={sections.courses} courses={getCourses(lang)} />,
    projects: (
      <Projects header={sections.projects} projects={getProjects(lang)} />
    ),
    contributing: (
      <Contributing
        header={sections.contributing}
        content={getContributing(lang)}
        initiatives={getInitiatives(lang)}
      />
    ),
    contact: (
      <Contact
        header={sections.contact}
        cards={getContactCards(lang, profile, messages)}
        social={social}
        socialLabel={messages.frame.socialLinks}
      />
    ),
  };

  return (
    <main id="main" className="play" tabIndex={-1}>
      <GameLoader
        places={places}
        home={homePath(lang)}
        panels={panels}
        records={getHolocrons(lang)}
      />
    </main>
  );
}
