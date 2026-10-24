import AboutMe from './about-me';
import ProfessionalExperience from './professional-experience';
import AcademicEducation from './academic-education';
import Projects from './projects';
import Contact from './contact';
import Contributing from './contributing';
import Courses from './courses';
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

// Regenerates the page once a day, so the current role's duration and the
// age in the contact section do not stay frozen at the last deploy.
export const revalidate = 86400;

export default function Home() {
  const locale = 'en';
  const profile = getProfile(locale);
  const social = getSocialLinks(profile);
  const sections = getSections(locale, profile);
  const experiences = getExperiences(locale);
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
        cards={getContactCards(locale, profile)}
        social={social}
      />
    </main>
  );
}
