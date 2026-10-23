import AboutMe from './about-me';
import ProfessionalExperience from './professional-experience';
import AcademicEducation from './academic-education';
import Projects from './projects';
import Contact from './contact';
import Contributing from './contributing';
import Courses from './courses';
import { getExperiences } from './professional-experience/experiences';

// Regenerates the page once a day, so the current role's duration and the
// age in the contact section do not stay frozen at the last deploy.
export const revalidate = 86400;

export default function Home() {
  // The experience without an end date is the current one.
  const current = getExperiences().find((experience) =>
    experience.date.endsWith('Present'),
  );

  return (
    <main>
      <AboutMe
        currentRole={
          current && {
            // "Software Engineer (Node.js / GraphQL Platform)" reads as
            // "Software Engineer" in the short line under the name.
            title: current.title.replace(/\s*\(.*\)$/, ''),
            company: current.company,
          }
        }
      />
      <ProfessionalExperience />
      <AcademicEducation />
      <Courses />
      <Projects />
      <Contributing />
      <Contact />
    </main>
  );
}
