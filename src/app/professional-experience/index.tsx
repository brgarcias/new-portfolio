// COMPONENTS
import Section from '@/src/components/Section';
import ExperienceItem from './ExperienceItem';
// CONTENT
import type { Experience, SectionHeader } from '@/src/content';
// CSS
import './styles.css';

interface ProfessionalExperienceProps {
  header: SectionHeader;
  // From the most recent role.
  experiences: Experience[];
}

export default function ProfessionalExperience({
  header,
  experiences,
}: Readonly<ProfessionalExperienceProps>) {
  return (
    <Section header={header} className="experience">
      <div className="xp">
        {/* The rail draws itself as the page scrolls past the roles. */}
        <span className="xp__rail" aria-hidden="true">
          <span className="xp__rail-fill" />
        </span>
        <ol className="xp__list">
          {experiences.map((experience, index) => (
            <ExperienceItem
              key={experience.slug}
              company={experience.company}
              title={experience.title}
              date={experience.date}
              duration={experience.duration}
              stack={experience.stack}
              details={experience.details}
              current={experience.current}
              defaultOpen={index === 0}
            />
          ))}
        </ol>
      </div>
    </Section>
  );
}
