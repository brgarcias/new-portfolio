'use client';

// HOOKS
import { useRef, type CSSProperties, type ReactNode } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowUpRightFromSquare,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import { sectionIds, type SectionId } from '@/src/content/sections';
// GAME
import { Keycap } from './ui';
import { useDialog } from './useDialog';
import { biomes } from './world/biomes';

interface PanelProps {
  id: SectionId;
  // Read from the chart, without landing: the bar says so.
  remote?: boolean;
  // While it fades out, after it was closed: nothing in it answers.
  leaving: boolean;
  home: string;
  onClose: () => void;
  // The section, as the home page renders it.
  children: ReactNode;
}

// A section of the site over the flight, opened by landing on its pad, as
// a transmission on the ship's terminal: a bar with the planet and the
// landing zone, in the planet's color, the section as the site shows it,
// and a footer with the way back to the flight and to the section on the
// site. Read from the chart instead, the bar says it is a remote access,
// not a landing. It closes with its button, with Escape or with a click
// outside, and it takes its name from the section's title.
export default function Panel({
  id,
  remote = false,
  leaving,
  home,
  onClose,
  children,
}: Readonly<PanelProps>) {
  const { messages } = useI18n();
  const t = messages.game;
  const sheet = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useDialog(sheet, onClose, body, !leaving);
  const index = String(sectionIds.indexOf(id) + 1).padStart(2, '0');

  return (
    <div
      className="game-panel"
      data-remote={remote ? '' : undefined}
      data-leaving={leaving ? '' : undefined}
      inert={leaving}
      style={{ '--accent': biomes[id].accent } as CSSProperties}
    >
      <button
        type="button"
        className="game-panel__backdrop"
        aria-label={messages.dialog.close}
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={sheet}
        className="game-panel__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
      >
        <header className="game-panel__bar">
          <p className="game-panel__where">
            <span className="game-panel__dot" aria-hidden="true" />
            <span className="game-panel__planet">{biomes[id].planet}</span>
            <span className="g-label">
              {remote ? t.remoteAccess : `${t.landingZone} ${index}`}
            </span>
          </p>
          <button
            type="button"
            className="g-btn g-btn--icon game-panel__close"
            aria-label={messages.dialog.close}
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <div ref={body} className="game-panel__body" tabIndex={-1}>
          {children}
        </div>
        <footer className="game-panel__footer">
          <button type="button" className="g-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faArrowLeft} />
            {t.backToFlight}
            <Keycap>Esc</Keycap>
          </button>
          <a className="g-btn" href={`${home}#${id}`}>
            {t.openOnSite}
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </a>
        </footer>
      </div>
    </div>
  );
}
