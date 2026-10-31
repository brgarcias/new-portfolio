'use client';

// HOOKS
import { useEffect, useRef, useState, type CSSProperties } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowUpRightFromSquare,
  faLocationArrow,
  faRotateLeft,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import type { Holocrons } from '@/src/content';
import type { SectionId } from '@/src/content/sections';
// GAME
import type { Place } from './types';
import { HolocronIcon, Keycap, Pips } from './ui';
import { useDialog } from './useDialog';
import { biomes } from './world/biomes';

interface ArchiveProps {
  // While it fades out, after it was closed: nothing in it answers.
  leaving: boolean;
  places: Place[];
  records: Holocrons;
  found: SectionId[];
  // The records unlocked since the archive was last open, marked as new.
  fresh: SectionId[];
  // The record to show first, such as the one just unlocked.
  focus: SectionId | null;
  course: SectionId | null;
  onCourse: (id: SectionId) => void;
  // Whether anything was explored or recovered, which a new exploration
  // would clear.
  started: boolean;
  onStartOver: () => void;
  home: string;
  onClose: () => void;
}

// The holocron archive over the flight: the record each holocron unlocks,
// one per section, on the section's planet. A record found shows its text
// and the way to the section on the site; one still locked says where its
// holocron lies and can set a course there. It opens from the HUD or with
// H, and closes with its button, with Escape, with H again or with a click
// outside. A new exploration, at the bottom, clears the progress after a
// confirmation.
export default function Archive({
  leaving,
  places,
  records,
  found,
  fresh,
  focus,
  course,
  onCourse,
  started,
  onStartOver,
  home,
  onClose,
}: Readonly<ArchiveProps>) {
  const t = useI18n().messages.game;
  const sheet = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const record = useRef<HTMLElement>(null);
  const reset = useRef<HTMLButtonElement>(null);
  const keep = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  useDialog(sheet, onClose, focus ? record : close, !leaving);
  const total = places.length;
  const complete = found.length >= total;

  // The question takes the focus to its safe answer, and the answer brings
  // it back to the button that asked.
  const asked = useRef(false);
  useEffect(() => {
    if (confirming) keep.current?.focus();
    else if (asked.current) reset.current?.focus();
    asked.current = confirming;
  }, [confirming]);

  return (
    <div
      className="game-map archive"
      data-leaving={leaving ? '' : undefined}
      inert={leaving}
    >
      <button
        type="button"
        className="game-map__backdrop"
        aria-label={t.closeArchive}
        tabIndex={-1}
        onClick={onClose}
      />
      <section
        ref={sheet}
        className="game-map__sheet archive__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-title"
        tabIndex={-1}
      >
        <header className="game-map__head">
          <div className="game-map__heading">
            <p className="g-label game-map__eyebrow">
              {complete ? t.archiveComplete : t.mission}
            </p>
            <h2 id="archive-title" className="game-map__title">
              {t.archive}
            </h2>
          </div>
          <dl className="game-map__stats">
            <div>
              <dt className="g-label">{t.holocronsLabel}</dt>
              <dd>
                <Pips count={found.length} total={total} kind="diamond" />
                <span className="g-num">
                  {format(t.records, {
                    count: String(found.length),
                    total: String(total),
                  })}
                </span>
              </dd>
            </div>
          </dl>
          <button
            ref={close}
            type="button"
            className="g-btn game-map__close"
            aria-label={t.closeArchive}
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} />
            <Keycap>Esc</Keycap>
          </button>
        </header>
        <p className="archive__intro">
          {complete ? t.archiveDone : t.archiveIntro}
        </p>
        <ol className="archive__list">
          {places.map((place, index) => {
            const unlocked = found.includes(place.id);
            const isNew = fresh.includes(place.id);
            const planet = biomes[place.id].planet;
            const picked = course === place.id;
            return (
              <li
                key={place.id}
                className="record"
                data-locked={unlocked ? undefined : ''}
                data-new={isNew ? '' : undefined}
                style={
                  {
                    '--accent': biomes[place.id].accent,
                    '--i': index,
                  } as CSSProperties
                }
              >
                <article
                  ref={place.id === focus ? record : undefined}
                  className="record__card"
                  aria-labelledby={`record-${place.id}`}
                  tabIndex={-1}
                >
                  <p className="record__where">
                    <span className="record__index g-num">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <strong>{planet}</strong>
                    <span>{place.title}</span>
                    {isNew && (
                      <span className="record__new">{t.recordNew}</span>
                    )}
                    <HolocronIcon className="record__cube" />
                  </p>
                  {unlocked ? (
                    <>
                      <h3 id={`record-${place.id}`} className="record__title">
                        {records[place.id].title}
                      </h3>
                      <p className="record__text">{records[place.id].text}</p>
                      <a className="record__link" href={`${home}#${place.id}`}>
                        {t.openOnSite}
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                      </a>
                    </>
                  ) : (
                    <>
                      <h3 id={`record-${place.id}`} className="record__title">
                        {t.recordLocked}
                      </h3>
                      <p className="record__text">
                        {format(t.recordHint, { planet })}
                      </p>
                      <button
                        type="button"
                        className="g-btn record__course"
                        aria-label={format(t.setCourse, { place: planet })}
                        aria-pressed={picked}
                        onClick={() => onCourse(place.id)}
                      >
                        <FontAwesomeIcon icon={faLocationArrow} />
                        {picked
                          ? t.courseSet
                          : format(t.setCourse, { place: planet })}
                      </button>
                    </>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
        <footer className="archive__footer">
          {confirming ? (
            <div
              className="archive__confirm"
              role="group"
              aria-labelledby="archive-reset"
            >
              <p id="archive-reset">{t.resetQuestion}</p>
              <button
                type="button"
                className="g-btn g-btn--primary"
                onClick={onStartOver}
              >
                {t.resetConfirm}
              </button>
              <button
                ref={keep}
                type="button"
                className="g-btn"
                onClick={() => setConfirming(false)}
              >
                {t.resetCancel}
              </button>
            </div>
          ) : (
            <button
              ref={reset}
              type="button"
              className="g-btn archive__reset"
              disabled={!started}
              onClick={() => setConfirming(true)}
            >
              <FontAwesomeIcon icon={faRotateLeft} />
              {t.newExploration}
            </button>
          )}
          <button type="button" className="g-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faArrowLeft} />
            {t.backToFlight}
            <Keycap>Esc</Keycap>
          </button>
        </footer>
      </section>
    </div>
  );
}
