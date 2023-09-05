import AboutMe from "./about-me";
import ProfessionalExperience from "./professional-experience";

export default function Home() {
  return (
    <div className="pages-stack">
      <AboutMe />
      <ProfessionalExperience />
    </div>
  );
}
