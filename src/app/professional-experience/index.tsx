// COMPONENTS
import Section from '@/src/components/Section';
import ExperienceItem from './ExperienceItem';
import TechRibbon from './TechRibbon';
// CONTENT
import { getExperiences } from './experiences';
// CSS
import './styles.css';

export default function ProfessionalExperience() {
  const experiences = getExperiences();
  // Every technology the experiences name, from the most recent role.
  const technologies = [
    ...new Set(experiences.flatMap((experience) => experience.stack)),
  ];

  return (
    <Section id="experience" className="experience">
      <div className="xp">
        {/* The rail draws itself as the page scrolls past the roles. */}
        <span className="xp__rail" aria-hidden="true">
          <span className="xp__rail-fill" />
        </span>
        <ol className="xp__list">
          {experiences.map((experience, index) => (
            <ExperienceItem
              key={experience.id}
              company={experience.company}
              icon={experience.icon}
              title={experience.title}
              date={experience.date}
              duration={experience.duration}
              stack={experience.stack}
              description={experience.description}
              current={!experience.end}
              defaultOpen={index === 0}
            />
          ))}
        </ol>
      </div>
      <TechRibbon items={technologies} />
    </Section>
  );
}
