import AboutMe from "./about-me";
import ProfessionalExperience from "./professional-experience";
import AcademicEducation from "./academic-education";
import Projects from "./projects";
import Contact from "./contact";
import Contributing from "./contributing";
import Courses from "./courses";

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
