// ICONS
import { CapIcon } from '@/src/components/Icon';
// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
// CONTENT
import type { EducationStep, SectionHeader } from '@/src/content';
// CSS
import './styles.css';

interface AcademicEducationProps {
  header: SectionHeader;
  steps: EducationStep[];
}

// The degree, and any other, one under the other.
export default function AcademicEducation({
  header,
  steps,
}: Readonly<AcademicEducationProps>) {
  return (
    <Section header={header} className="education">
      <Reveal className="edu-wrap">
        <ol className="edu">
          {steps.map((step) => (
            <li key={step.slug} className="edu__item">
              <span className="edu__icon" aria-hidden="true">
                <CapIcon />
              </span>
              <p className="edu__label">{step.label}</p>
              <h3 className="edu__title">{step.title}</h3>
              <p className="edu__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
