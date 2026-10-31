'use client';

// HOOKS
import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowUpRightFromSquare,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import Reveal from '@/src/components/Reveal';
import ModalComponent from '@/src/components/Modal/Lazy';
import { openOnKey } from '@/src/components/Modal/openOnKey';
import Flow from './Flow';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import type { CaseStudy } from '@/src/content';

// A case study as a card: where and when, the title, the summary and the
// system's flow. The title's button covers the card and opens the whole
// case in a dialog: the context, the part Bruno played, what was built,
// the result and what it taught, each only when the content has it.
// The cases after the first ones are behind the button (`more`), and
// hidden until it shows them.
function CaseCard({
  item,
  more,
  hidden,
}: Readonly<{ item: CaseStudy; more: boolean; hidden: boolean }>) {
  const t = useI18n().messages.projects;
  const [visible, setVisible] = useState(false);
  const where = `${item.company} · ${item.period}`;
  const parts = [
    { title: t.context, text: item.context },
    { title: t.role, text: item.role },
    { title: t.built, text: item.built },
    { title: t.result, text: item.result },
    { title: t.learned, text: item.learned },
  ].filter((part) => part.text);

  return (
    <li className="case-card" data-more={more || undefined} hidden={hidden}>
      <p className="case-card__where">{where}</p>
      <h4 className="case-card__title">
        {/* The button covers the whole card, so a click anywhere opens it. */}
        <button
          type="button"
          className="case-card__button"
          aria-haspopup="dialog"
          onClick={() => setVisible(true)}
          onKeyDown={openOnKey(() => setVisible(true))}
        >
          {item.title}
        </button>
      </h4>
      <p className="case-card__summary">{item.summary}</p>
      <Flow steps={item.flow} label={format(t.flow, { title: item.title })} />
      <span className="case-card__more" aria-hidden="true">
        {t.readCase}
        <FontAwesomeIcon icon={faArrowRight} />
      </span>

      <ModalComponent
        visible={visible}
        setVisible={setVisible}
        size="4xl"
        title={item.title}
        subtitle={where}
        focusableBody
      >
        <div className="case-details">
          <p className="case-details__summary">{item.summary}</p>
          <Flow
            steps={item.flow}
            label={format(t.flow, { title: item.title })}
            size="large"
          />
          <div className="case-details__parts">
            {parts.map((part) => (
              <section key={part.title} className="case-details__part">
                <h3>{part.title}</h3>
                <p>{part.text}</p>
              </section>
            ))}
          </div>
          <div className="case-details__footer">
            <ul className="tag-list" aria-label={t.stack}>
              {item.stack.map((name) => (
                <li key={name} className="tag">
                  {name}
                </li>
              ))}
            </ul>
            {item.link && (
              <a
                className="btn btn--ghost btn--small"
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.website}
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              </a>
            )}
          </div>
        </div>
      </ModalComponent>
    </li>
  );
}

// The first cases show at once, one from each company; the others wait
// behind a button, so the section doesn't grow long.
const shownFirst = 4;

// The case studies, before the websites: the projects where the work
// behind the screen shows.
export default function Cases({
  cases,
}: Readonly<{ cases: readonly CaseStudy[] }>) {
  const t = useI18n().messages.projects;
  const [expanded, setExpanded] = useState(false);
  const gridId = useId();
  const grid = useRef<HTMLUListElement>(null);
  if (!cases.length) return null;
  const rest = cases.length - shownFirst;

  // Showing the others takes the focus to the first of them, so the keyboard
  // and screen readers go on from there. Hiding them again brings the button
  // back into view, which otherwise went up out of the screen.
  const toggle = (button: HTMLButtonElement) => {
    flushSync(() => setExpanded(!expanded));
    if (expanded) {
      button.scrollIntoView({ block: 'nearest' });
      return;
    }
    grid.current
      ?.querySelectorAll<HTMLButtonElement>('.case-card__button')
      [shownFirst]?.focus();
  };

  return (
    <div className="cases">
      <h3 className="projects__group">{t.cases}</h3>
      {/* Tall on a phone, so it enters as soon as its top shows: at the
          usual 15%, a phone arriving from the menu saw an empty space
          under the section's header. */}
      <Reveal className="cases__body" amount={0.05}>
        <ul id={gridId} ref={grid} className="cases__grid">
          {cases.map((item, index) => (
            <CaseCard
              key={item.slug}
              item={item}
              more={index >= shownFirst}
              hidden={!expanded && index >= shownFirst}
            />
          ))}
        </ul>
        {rest > 0 && (
          <div className="cases__more">
            <button
              type="button"
              className="btn btn--ghost btn--small"
              aria-expanded={expanded}
              aria-controls={gridId}
              onClick={(event) => toggle(event.currentTarget)}
            >
              {expanded
                ? t.fewerCases
                : rest === 1
                  ? t.oneMoreCase
                  : format(t.moreCases, { count: rest })}
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
          </div>
        )}
      </Reveal>
    </div>
  );
}
