// COMPONENTS
import Section from '@/src/components/Section';
import EarlierRoles from './EarlierRoles';
import ExperienceItem from './ExperienceItem';
import TechRibbon from './TechRibbon';
// CONTENT
import type { Experience, SectionHeader } from '@/src/content';
// CSS
import './styles.css';

interface ProfessionalExperienceProps {
  header: SectionHeader;
  // From the most recent role.
  experiences: Experience[];
}

const itemProps = ({
  company,
  icon,
  title,
  date,
  duration,
  stack,
  details,
  current,
}: Experience) => ({
  company,
  icon,
  title,
  date,
  duration,
  stack,
  details,
  current,
});

export default function ProfessionalExperience({
  header,
  experiences,
}: Readonly<ProfessionalExperienceProps>) {
  const recent = experiences.filter((experience) => !experience.earlier);
  const earlier = experiences.filter((experience) => experience.earlier);
  // Every technology the experiences name, from the most recent role.
  const technologies = [
    ...new Set(experiences.flatMap((experience) => experience.stack)),
  ];

  return (
    <Section header={header} className="experience">
      <div className="xp">
        {/* The rail draws itself as the page scrolls past the roles. */}
        <span className="xp__rail" aria-hidden="true">
          <span className="xp__rail-fill" />
        </span>
        <ol className="xp__list">
          {recent.map((experience, index) => (
            <ExperienceItem
              key={experience.slug}
              {...itemProps(experience)}
              defaultOpen={index === 0}
            />
          ))}
        </ol>
        {earlier.length > 0 && (
          <EarlierRoles count={earlier.length}>
            {earlier.map((experience) => (
              <ExperienceItem
                key={experience.slug}
                {...itemProps(experience)}
              />
            ))}
          </EarlierRoles>
        )}
      </div>
      <TechRibbon items={technologies} />
    </Section>
  );
}
