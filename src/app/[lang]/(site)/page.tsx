// NEXT
import { notFound } from 'next/navigation';
// SECTIONS
import AboutMe from '../../about-me';
import ProfessionalExperience from '../../professional-experience';
import AcademicEducation from '../../academic-education';
import Projects from '../../projects';
import Contact from '../../contact';
import Contributing from '../../contributing';
import Courses from '../../courses';
// COMPONENTS
import OffscreenPause from '@/src/components/OffscreenPause';
// CONTENT
import {
  getAbout,
  getContactCards,
  getContributing,
  getCourses,
  getEducation,
  getExperiences,
  getHero,
  getInitiatives,
  getProfile,
  getProjects,
  getSections,
  getSocialLinks,
} from '@/src/content';
// I18N
import { isLocale, locales } from '@/src/i18n/config';
import { getMessages } from '@/src/i18n/messages';

// Regenerates the page once a day, so the current role's duration and the
// age in the contact section do not stay frozen at the last deploy.
export const revalidate = 86400;

// One page per language, built ahead. "/" serves the English one, through
// a rewrite in next.config.mjs. Any other first segment is an address with
// no page, which src/app/not-found.tsx answers.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang;
  const messages = getMessages(locale);
  const profile = getProfile(locale);
  const social = getSocialLinks(profile, messages);
  const sections = getSections(locale, profile);
  const experiences = getExperiences(locale, messages);
  // The experience without an end date is the current one.
  const current = experiences.find((experience) => experience.current);

  return (
    <main id="main" tabIndex={-1}>
      <AboutMe
        header={sections.about}
        profile={profile}
        hero={getHero(locale)}
        about={getAbout(locale)}
        social={social}
        currentRole={
          current && {
            // "Software Engineer (Node.js / GraphQL Platform)" reads as
            // "Software Engineer" in the short line under the name.
            title: current.title.split(' (')[0],
            company: current.company,
          }
        }
      />
      <ProfessionalExperience
        header={sections.experience}
        experiences={experiences}
      />
      <AcademicEducation
        header={sections.education}
        steps={getEducation(locale)}
      />
      <Courses header={sections.courses} courses={getCourses(locale)} />
      <Projects header={sections.projects} projects={getProjects(locale)} />
      <Contributing
        header={sections.contributing}
        content={getContributing(locale)}
        initiatives={getInitiatives(locale)}
      />
      <Contact
        header={sections.contact}
        cards={getContactCards(locale, profile, messages)}
        social={social}
        socialLabel={messages.frame.socialLinks}
      />
      <OffscreenPause />
    </main>
  );
}
