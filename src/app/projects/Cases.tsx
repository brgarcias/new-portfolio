'use client';

// NEXT
import Image from 'next/image';
// HOOKS
import {
  type Dispatch,
  type SetStateAction,
  useId,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
// ICONS
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
} from '@/src/components/Icon';
// COMPONENTS
import Reveal from '@/src/components/Reveal';
import ModalComponent from '@/src/components/Modal/Lazy';
import { openOnKey } from '@/src/components/Modal/openOnKey';
import Flow from './Flow';
import { tilt, untilt } from './tilt';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import type { CaseStudy } from '@/src/content';

// The whole case in a dialog: the screenshot, the system's flow, the context,
// the part Bruno played, what was built, the decisions behind it, the result
// and what it taught, each only when the content has it.
function CaseDialog({
  item,
  visible,
  setVisible,
}: Readonly<{
  item: CaseStudy;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}>) {
  const t = useI18n().messages.projects;
  const before = [
    { title: t.context, text: item.context },
    { title: t.role, text: item.role },
    { title: t.built, text: item.built },
  ].filter((part) => part.text);
  const after = [
    { title: t.result, text: item.result },
    { title: t.learned, text: item.learned },
  ].filter((part) => part.text);
  const part = ({ title, text }: { title: string; text?: string }) => (
    <section key={title} className="case-details__part">
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );

  return (
    <ModalComponent
      visible={visible}
      setVisible={setVisible}
      size="4xl"
      title={item.title}
      subtitle={`${item.company} · ${item.period}`}
      focusableBody
    >
      <div className="case-details">
        <p className="case-details__summary">{item.summary}</p>
        <Flow
          steps={item.flow}
          label={format(t.flow, { title: item.title })}
          size="large"
        />
        {item.image && (
          <Image
            className="case-details__image"
            src={item.image.src}
            width={item.image.width}
            height={item.image.height}
            alt={format(t.screenshot, { title: item.title })}
            unoptimized
          />
        )}
        <div className="case-details__parts">
          {before.map(part)}
          {item.decisions && item.decisions.length > 0 && (
            <section className="case-details__part case-details__part--wide">
              <h3>{t.decisions}</h3>
              <ul className="case-details__decisions">
                {item.decisions.map((decision) => (
                  <li key={decision.title}>
                    <h4>{decision.title}</h4>
                    <p>{decision.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {after.map(part)}
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
              <ExternalLinkIcon />
            </a>
          )}
        </div>
      </div>
    </ModalComponent>
  );
}

// The first case, the one that leads the section: what it does, a real
// screenshot in perspective, which leans towards the mouse, and the system's
// diagram across the block, with the data going through it.
function FeaturedCase({ item }: Readonly<{ item: CaseStudy }>) {
  const t = useI18n().messages.projects;
  const [visible, setVisible] = useState(false);
  const open = () => setVisible(true);

  return (
    <Reveal className="case-feature-wrap" amount={0.05}>
      <article className="case-feature" data-loop>
        <div className="case-feature__intro">
          <p className="case-feature__label">{t.featured}</p>
          <p className="case-card__where">
            {item.company} · {item.period}
          </p>
          <h3 className="case-feature__title">{item.title}</h3>
          <p className="case-feature__summary">{item.summary}</p>
          <p className="case-feature__stack">{item.stack.join(' · ')}</p>
          <button
            type="button"
            className="btn btn--primary case-feature__open"
            aria-haspopup="dialog"
            onClick={open}
            onKeyDown={openOnKey(open)}
          >
            {t.readCase}
            <ArrowRightIcon />
          </button>
        </div>
        {item.image && (
          <div
            className="case-stage"
            onPointerMove={tilt}
            onPointerLeave={untilt}
          >
            <div className="case-stage__plane">
              <span className="case-stage__sheet" aria-hidden="true" />
              <div className="case-stage__window">
                <span className="case-stage__bar" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <Image
                  src={item.image.src}
                  width={item.image.width}
                  height={item.image.height}
                  alt={format(t.screenshot, { title: item.title })}
                  unoptimized
                />
              </div>
            </div>
          </div>
        )}
        <div className="case-feature__diagram">
          <Flow
            steps={item.flow}
            label={format(t.flow, { title: item.title })}
            size="large"
          />
        </div>
      </article>
      <CaseDialog item={item} visible={visible} setVisible={setVisible} />
    </Reveal>
  );
}

// A case study as a card: where and when, the title, the summary and the
// system's flow. The title's button covers the card and opens the whole case.
// The cases after the first ones are behind the button (`more`), and hidden
// until it shows them.
function CaseCard({
  item,
  more,
  hidden,
}: Readonly<{ item: CaseStudy; more: boolean; hidden: boolean }>) {
  const t = useI18n().messages.projects;
  const [visible, setVisible] = useState(false);

  return (
    <li className="case-card" data-more={more || undefined} hidden={hidden}>
      <p className="case-card__where">
        {item.company} · {item.period}
      </p>
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
        <ArrowRightIcon />
      </span>
      <CaseDialog item={item} visible={visible} setVisible={setVisible} />
    </li>
  );
}

// After the featured case, the next ones show at once, one from each company;
// the others wait behind a button, so the section doesn't grow long.
const shownFirst = 4;

// The case studies, before the websites: the projects where the work behind
// the screen shows.
export default function Cases({
  cases,
}: Readonly<{ cases: readonly CaseStudy[] }>) {
  const t = useI18n().messages.projects;
  const [expanded, setExpanded] = useState(false);
  const gridId = useId();
  const grid = useRef<HTMLUListElement>(null);
  if (!cases.length) return null;
  const [featured, ...others] = cases;
  const rest = others.length - shownFirst;

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
      <FeaturedCase item={featured} />
      {others.length > 0 && (
        <>
          <h3 className="projects__group">{t.moreCaseStudies}</h3>
          {/* Tall on a phone, so it enters as soon as its top shows: at the
              usual 15%, a phone arriving from the menu saw an empty space
              under the section's header. */}
          <Reveal className="cases__body" amount={0.05}>
            <ul id={gridId} ref={grid} className="cases__grid">
              {others.map((item, index) => (
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
                  <ChevronDownIcon />
                </button>
              </div>
            )}
          </Reveal>
        </>
      )}
    </div>
  );
}
