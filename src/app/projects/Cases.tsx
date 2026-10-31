'use client';

// HOOKS
import { useState } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faArrowUpRightFromSquare,
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
function CaseCard({ item }: Readonly<{ item: CaseStudy }>) {
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
    <li className="case-card">
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

// The case studies, before the websites: the projects where the work
// behind the screen shows.
export default function Cases({
  cases,
}: Readonly<{ cases: readonly CaseStudy[] }>) {
  const t = useI18n().messages.projects;
  if (!cases.length) return null;
  return (
    <div className="cases">
      <h3 className="projects__group">{t.cases}</h3>
      <Reveal className="cases__body">
        <ul className="cases__grid">
          {cases.map((item) => (
            <CaseCard key={item.slug} item={item} />
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
