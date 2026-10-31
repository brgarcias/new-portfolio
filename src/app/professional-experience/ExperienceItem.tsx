'use client';

// HOOKS
import { useId, useState } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import Reveal from '@/src/components/Reveal';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { Experience } from '@/src/content';

interface ExperienceItemProps {
  company: string;
  title: string;
  date: string;
  duration: string;
  stack: string[];
  // What the card opens: groups of items, each with an optional heading.
  details: Experience['details'];
  current?: boolean;
  defaultOpen?: boolean;
}

// A role on the timeline: the company and the period beside a point on the
// rail, and a card whose title opens the details.
export default function ExperienceItem({
  company,
  title,
  date,
  duration,
  stack,
  details,
  current = false,
  defaultOpen = false,
}: Readonly<ExperienceItemProps>) {
  const t = useI18n().messages.experience;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const detailsId = useId();

  return (
    <li className={`xp-item${current ? ' xp-item--current' : ''}`}>
      <span className="xp-item__node" aria-hidden="true" />

      <Reveal className="xp-item__meta">
        <p className="xp-item__company">{company}</p>
        <p className="xp-item__period">
          {date}
          {/* On wide screens the duration gets its own line. */}
          {duration && (
            <span className="xp-item__duration">
              <span className="xp-item__separator"> · </span>
              {duration}
            </span>
          )}
        </p>
      </Reveal>

      <Reveal className="xp-card" delay={0.08}>
        <h3 className="xp-card__title">
          <button
            type="button"
            className="xp-card__toggle"
            aria-expanded={isOpen}
            aria-controls={detailsId}
            onClick={() => setIsOpen(!isOpen)}
          >
            {title}
            <span className="xp-card__chevron" aria-hidden="true">
              <FontAwesomeIcon icon={faChevronDown} />
            </span>
          </button>
        </h3>

        {stack.length > 0 && (
          <ul className="tag-list xp-card__stack" aria-label={t.technologies}>
            {stack.map((name) => (
              <li key={name} className="tag">
                {name}
              </li>
            ))}
          </ul>
        )}

        {/* Collapsed, the details keep no height and leave the tab order. */}
        <div
          id={detailsId}
          className={`xp-card__details${isOpen ? ' is-open' : ''}`}
          inert={!isOpen}
        >
          <div className="xp-card__details-inner">
            {details.map((group, index) => (
              <div key={index} className="xp-card__group">
                {group.heading && <h4>{group.heading}</h4>}
                <ul>
                  {group.items.map((item, position) => (
                    <li key={position}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </li>
  );
}
