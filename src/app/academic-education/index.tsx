'use client';

// HOOKS
import { CSSProperties, KeyboardEvent, useId, useRef, useState } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faHeart } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
// CONTENT
import { steps } from './sections';
// CSS
import './styles.css';

const last = steps.length - 1;
// Past the last finished step, the rail turns dashed.
const finished = steps.filter((step) => !step.upcoming).length - 1;

// Arrow keys move to the next or previous step, wrapping around, and Home
// and End jump to the ends, as in any list of tabs.
const keyMoves: Record<string, (index: number) => number> = {
  ArrowDown: (index) => (index === last ? 0 : index + 1),
  ArrowRight: (index) => (index === last ? 0 : index + 1),
  ArrowUp: (index) => (index === 0 ? last : index - 1),
  ArrowLeft: (index) => (index === 0 ? last : index - 1),
  Home: () => 0,
  End: () => last,
};

export default function AcademicEducation() {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const move = keyMoves[event.key];
    if (!move) return;
    event.preventDefault();
    const next = move(active);
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
      id="education"
      description={
        <>
          Postgraduate Coming Soon{' '}
          <FontAwesomeIcon icon={faHeart} style={{ color: 'red' }} />
        </>
      }
      quote={{
        text: 'The learned man is a discoverer of facts that already exist - but the wise man is a creator of values that do not exist and that he makes exist.',
        author: 'Albert Einstein',
      }}
    >
      <Reveal className="edu-wrap">
        <div className="edu" style={railStyle}>
          <div
            className="edu__steps"
            role="tablist"
            aria-label="Education"
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
                key={step.label}
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
              key={step.label}
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
              <p className="edu-panel__text">{step.content}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
