// NEXT
import { notFound } from 'next/navigation';
// SECTIONS
import Hero from '../../about-me';
import About from '../../about-me/About';
import Expertise from '../../expertise';
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
  getContact,
  getCases,
  getContributing,
  getCourses,
  getEducation,
  getExperiences,
  getExpertise,
  getHero,
  getInitiatives,
  getProfile,
  getProjects,
  getSections,
  getSocialLinks,
} from '@/src/content';
// I18N
import { isLocale, locales, pagePath } from '@/src/i18n/config';
import { getMessages } from '@/src/i18n/messages';

// Regenerates the page once a day, so the current role's duration does not
// stay frozen at the last deploy.
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
      <Hero
        profile={profile}
        hero={getHero(locale)}
        social={social}
        t={messages.hero}
        playHref={pagePath(locale, 'play')}
        currentRole={
          current && {
            // "Software Engineer (Node.js / GraphQL Platform)" reads as
            // "Software Engineer" in the short line under the name.
            title: current.title.split(' (')[0],
            company: current.company,
          }
        }
      />
      <Projects
        header={sections.projects}
        cases={getCases(locale)}
        projects={getProjects(locale)}
      />
      <Expertise header={sections.expertise} expertise={getExpertise(locale)} />
      <ProfessionalExperience
        header={sections.experience}
        experiences={experiences}
      />
      <About header={sections.about} about={getAbout(locale)} />
      {/* Beside each other on a wide screen: what backs up the rest. */}
      <div className="study">
        <AcademicEducation
          header={sections.education}
          steps={getEducation(locale)}
        />
        <Courses header={sections.courses} courses={getCourses(locale)} />
      </div>
      <Contributing
        header={sections.contributing}
        content={getContributing(locale)}
        initiatives={getInitiatives(locale)}
      />
      <Contact
        header={sections.contact}
        contact={getContact(locale, profile)}
        social={social}
        labels={messages.contact}
      />
      <OffscreenPause />
    </main>
  );
}
