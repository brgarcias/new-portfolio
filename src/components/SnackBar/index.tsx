// REACT UTILS
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CSS
import './styles.css';

interface SnackbarProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

const AUTO_HIDE_DURATION = 5000;

// The notice that a message went out, in the corner of the screen. It is
// rendered in the body, so no ancestor with a transform can hold it.
export default function SnackbarFeedback({
  open,
  onClose,
  title,
  description,
}: Readonly<SnackbarProps>) {
  const t = useI18n().messages.dialog;
  // Stays rendered after closing until the slide-out transition ends.
  const [rendered, setRendered] = useState(open);
  const timerAutoHide = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (open && !rendered) {
    setRendered(true);
  }

  const close = useCallback(() => onClose(), [onClose]);

  const startTimer = useCallback(
    (duration: number) => {
      clearTimeout(timerAutoHide.current);
      timerAutoHide.current = setTimeout(close, duration);
    },
    [close],
  );

  // Pauses while the user hovers or focuses the snackbar, or leaves the
  // window, and resumes with half of the original duration.
  const pauseTimer = useCallback(() => clearTimeout(timerAutoHide.current), []);
  const resumeTimer = useCallback(
    () => startTimer(AUTO_HIDE_DURATION / 2),
    [startTimer],
  );

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (!event.defaultPrevented && event.key === 'Escape') close();
    }

    startTimer(AUTO_HIDE_DURATION);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('focus', resumeTimer);
    window.addEventListener('blur', pauseTimer);
    return () => {
      clearTimeout(timerAutoHide.current);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('focus', resumeTimer);
      window.removeEventListener('blur', pauseTimer);
    };
  }, [open, close, startTimer, pauseTimer, resumeTimer]);

  // Removes the notice once it has slid out. The transitionend below usually
  // does it; this covers a close during the entrance, when the slide out
  // never runs and no transitionend comes.
  useEffect(() => {
    if (open || !rendered) return;
    const timer = setTimeout(() => setRendered(false), 400);
    return () => clearTimeout(timer);
  }, [open, rendered]);

  if (!rendered) return null;

  return createPortal(
    <div
      className="snackbar"
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      {/* A status, so screen readers announce how the sending went. */}
      <div
        className={`snackbar__content${open ? '' : ' snackbar__content--exiting'}`}
        role="status"
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && !open) {
            setRendered(false);
          }
        }}
      >
        <FontAwesomeIcon className="snackbar__icon" icon={faCheck} />
        <div className="snackbar-message">
          <p className="snackbar-title">{title}</p>
          <p className="snackbar-description">{description}</p>
        </div>
        <button
          type="button"
          className="snackbar__close"
          aria-label={t.closeNotice}
          onClick={close}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
