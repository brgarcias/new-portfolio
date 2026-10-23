import ExperienceItem from './ExperienceItem';
import { getExperiences } from './experiences';
// COMPONENTS
import Section from '@/src/components/Section';
import './styles.css';

export default function ProfessionalExperience() {
  return (
    <Section id="experience">
      <div className="main">
        <ul className="cbp_tmtimeline">
          {getExperiences().map((experience, index) => (
            <ExperienceItem
              key={experience.id}
              {...experience}
              defaultOpen={index === 0}
            />
          ))}
        </ul>
      </div>
    </Section>
  );
}
