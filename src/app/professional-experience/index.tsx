import ExperienceItem from "./ExperienceItem";
import { experiences } from "./experiences";
import "./styles.css";

export default function ProfessionalExperience() {
  return (
    <div className="page" id="professional-experience">
      <header className="bp-header cf">
        <h1 className="bp-header__title">Professional Experience</h1>
      </header>

      <div className="main">
        <ul className="cbp_tmtimeline">
          {experiences.map((experience, index) => (
            <ExperienceItem
              key={experience.id}
              {...experience}
              defaultOpen={index === 0}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
