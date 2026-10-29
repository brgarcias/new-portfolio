'use client';

// HOOKS
import { useEffect, useRef, type ReactNode } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { SectionId } from '@/src/content/sections';

interface PanelProps {
  id: SectionId;
  home: string;
  onClose: () => void;
  // The section, as the home page renders it.
  children: ReactNode;
}

// A section of the site over the flight, opened by landing on its pad. It
// closes with its button, with Escape or with a click outside, and it
// takes its name from the section's title.
export default function Panel({
  id,
  home,
  onClose,
  children,
}: Readonly<PanelProps>) {
  const { messages } = useI18n();
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sheet.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="game-panel">
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
        <div className="game-panel__bar">
          <button
            type="button"
            className="game-panel__close"
            aria-label={messages.dialog.close}
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        {children}
        <p className="game-panel__footer">
          <a className="btn btn--ghost btn--small" href={`${home}#${id}`}>
            {messages.game.openOnSite}
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </a>
        </p>
      </div>
    </div>
  );
}
