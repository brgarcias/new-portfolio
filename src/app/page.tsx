import AboutMe from './about-me';
import ProfessionalExperience from './professional-experience';
import AcademicEducation from './academic-education';
import Projects from './projects';
import Contact from './contact';
import Contributing from './contributing';
import Courses from './courses';

// Regenerates the page once a day, so the current role's duration and the
// age in the contact section do not stay frozen at the last deploy.
export const revalidate = 86400;

export default function Home() {
  return (
    <div className="pages-stack">
      <AboutMe />
      <ProfessionalExperience />
      <AcademicEducation />
      <Courses />
      <Projects />
      <Contributing />
      <Contact />
    </div>
  );
}
