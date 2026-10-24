'use client';

// HOOKS
import { CSSProperties, KeyboardEvent, useId, useRef, useState } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faHeart } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { EducationStep, SectionHeader } from '@/src/content';
// CSS
import './styles.css';

// Arrow keys move to the next or previous step, wrapping around, and Home
// and End jump to the ends, as in any list of tabs.
const keyMoves: Record<string, (index: number, last: number) => number> = {
  ArrowDown: (index, last) => (index === last ? 0 : index + 1),
  ArrowRight: (index, last) => (index === last ? 0 : index + 1),
  ArrowUp: (index, last) => (index === 0 ? last : index - 1),
  ArrowLeft: (index, last) => (index === 0 ? last : index - 1),
  Home: () => 0,
  End: (_, last) => last,
};

interface AcademicEducationProps {
  header: SectionHeader;
  steps: EducationStep[];
}

export default function AcademicEducation({
  header,
  steps,
}: Readonly<AcademicEducationProps>) {
  const t = useI18n().messages.education;
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const last = steps.length - 1;
  // Past the last finished step, the rail turns dashed.
  const finished = steps.filter((step) => !step.upcoming).length - 1;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const move = keyMoves[event.key];
    if (!move) return;
    event.preventDefault();
    const next = move(active, last);
    setActive(next);
    tabs.current[next]?.focus();
  };

  // The marker and the filled part of the rail follow the chosen step.
  const railStyle = {
    '--count': steps.length,
    '--step': active,
    '--progress': active / last,
    '--finished': finished / last,
  } as CSSProperties;

  return (
    <Section
      header={header}
      descriptionEnd={
        <>
          {' '}
          <FontAwesomeIcon icon={faHeart} style={{ color: 'red' }} />
        </>
      }
    >
      <Reveal className="edu-wrap">
        <div className="edu" style={railStyle}>
          <div
            className="edu__steps"
            role="tablist"
            aria-label={t.steps}
            aria-orientation="vertical"
          >
            <span className="edu__rail" aria-hidden="true">
              <span className="edu__rail-fill" />
            </span>
            <span className="edu__marker" aria-hidden="true">
              <FontAwesomeIcon icon={faGraduationCap} />
            </span>
            {steps.map((step, index) => (
              <button
                key={step.slug}
                ref={(element) => {
                  tabs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                className={[
                  'edu-step',
                  step.upcoming && 'edu-step--upcoming',
                  index < active && 'is-passed',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-selected={active === index}
                aria-controls={`${id}-panel-${index}`}
                tabIndex={active === index ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={onKeyDown}
              >
                <span className="edu-step__number" aria-hidden="true">
                  {index + 1}
                </span>
                {step.label}
              </button>
            ))}
          </div>

          {steps.map((step, index) => (
            <div
              key={step.slug}
              id={`${id}-panel-${index}`}
              className="edu-panel"
              role="tabpanel"
              aria-labelledby={`${id}-tab-${index}`}
              tabIndex={0}
              hidden={active !== index}
            >
              <p className="edu-panel__step">
                {String(index + 1).padStart(2, '0')} · {step.label}
              </p>
              <h3 className="edu-panel__title">{step.title}</h3>
              <p className="edu-panel__text">{step.text}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
