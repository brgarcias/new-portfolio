'use client';

// HOOKS
import { useId, useState } from 'react';
// FONT AWESOME
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import Reveal from '@/src/components/Reveal';

interface ExperienceItemProps {
  company: string;
  icon: IconProp;
  title: string;
  date: string;
  duration: string;
  stack: string[];
  description: string;
  current?: boolean;
  defaultOpen?: boolean;
}

export default function ExperienceItem({
  company,
  icon,
  title,
  date,
  duration,
  stack,
  description,
  current = false,
  defaultOpen = false,
}: Readonly<ExperienceItemProps>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const detailsId = useId();

  return (
    <li className={`xp-item${current ? ' xp-item--current' : ''}`}>
      <span className="xp-item__node" aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>

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
          <ul className="tag-list xp-card__stack" aria-label="Technologies">
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
          <div
            className="xp-card__details-inner"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      </Reveal>
    </li>
  );
}
