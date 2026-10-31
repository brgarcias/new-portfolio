// CONTENT
import type { CaseStudy } from '@/src/content';

interface FlowProps {
  steps: CaseStudy['flow'];
  // The diagram's name, for screen readers.
  label: string;
  // Small on a card, large in the case study's dialog.
  size?: 'small' | 'large';
}

// The flow of a case study's system, step by step: each step's name and,
// under it, what it runs on, joined by arrows. An ordered list, so screen
// readers follow the steps in order; the arrows are only drawn.
export default function Flow({
  steps,
  label,
  size = 'small',
}: Readonly<FlowProps>) {
  return (
    <ol className={`flow flow--${size}`} aria-label={label}>
      {steps.map((step, index) => (
        <li key={`${index}-${step.label}`} className="flow__step">
          {index > 0 && (
            <svg
              className="flow__arrow"
              viewBox="0 0 24 12"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M1 6h20M15.5 1.5L21 6l-5.5 4.5" />
            </svg>
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
