import AboutMe from "./about-me";
import AcademicEducation from "./academic-education";
import Contact from "./contact";
import ProfessionalExperience from "./professional-experience";

export default function Home() {
  return (
    <div className="pages-stack">
      <AboutMe />
      <ProfessionalExperience />
      <AcademicEducation />
      <Contact />
    </div>
  );
}
