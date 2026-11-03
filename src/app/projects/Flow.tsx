// HOOKS
import type { CSSProperties } from 'react';
// CONTENT
import type { CaseStudy } from '@/src/content';

interface FlowProps {
  steps: CaseStudy['flow'];
  // The diagram's name, for screen readers.
  label: string;
  // Small on a card, large in the case study's dialog and the featured case.
  size?: 'small' | 'large';
}

// The flow of a case study's system, step by step: each step's name and,
// under it, what it runs on, joined by arrows. An ordered list, so screen
// readers follow the steps in order; the arrows are only drawn. A pulse goes
// from step to step, as the data does: all the time on the featured case, and
// when the pointer is over a card, by the styles.
export default function Flow({
  steps,
  label,
  size = 'small',
}: Readonly<FlowProps>) {
  return (
    <ol
      className={`flow flow--${size}`}
      aria-label={label}
      style={{ '--steps': steps.length } as CSSProperties}
    >
      {steps.map((step, index) => (
        <li
          key={`${index}-${step.label}`}
          className="flow__step"
          style={{ '--i': index } as CSSProperties}
        >
          {index > 0 && (
            <span className="flow__link" aria-hidden="true">
              <svg
                className="flow__arrow"
                viewBox="0 0 24 12"
                focusable="false"
              >
                <path d="M1 6h20M15.5 1.5L21 6l-5.5 4.5" />
              </svg>
              <span className="flow__pulse" />
            </span>
          )}
          <span className="flow__node">
            <span className="flow__label">{step.label}</span>
            {step.detail && <span className="flow__detail">{step.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
