import Image from "next/image";
// IMAGES
import ProfessionalExperienceImg from "@/public/images/professional-experience/professional-experience.png";
// SASS
import "./styles.css";
import ExperienceItem from "./ExperienceItem";
import { experiences } from "./experiences";

export default function ProfessionalExperience() {
  return (
    <div className="page" id="professional-experience">
      <header className="bp-header cf">
        <h1 className="bp-header__title">Professional Experience</h1>
      </header>

      <div className="main">
        <ul className="cbp_tmtimeline">
          {experiences.map((experience, index) => (
            <ExperienceItem key={index} {...experience} />
          ))}
        </ul>
      </div>

      <div>
        <Image
          className="poster poster-2"
          src={ProfessionalExperienceImg}
          alt="Bruno Garcia"
          unoptimized
        />
      </div>
    </div>
  );
}
