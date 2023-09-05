import AboutMe from "./about-me";
import AcademicEducation from "./academic-education";
import ProfessionalExperience from "./professional-experience";

export default function Home() {
  return (
    <div className="pages-stack">
      <AboutMe />
      <ProfessionalExperience />
      <AcademicEducation />
    </div>
  );
}
