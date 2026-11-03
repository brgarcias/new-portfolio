// REACT UTILS
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CSS
import './styles.css';
// ICONS
import { XIcon, type IconComponent } from '@/src/components/Icon';

type Content = {
  open: boolean;
  title: string;
  description: string;
  icon: IconComponent;
  colorIcon: string;
};

type SnackbarProps = {
  content: Content;
  setOpen: Dispatch<SetStateAction<Content>>;
};

const AUTO_HIDE_DURATION = 5000;

export default function SnackbarFeedback({
  content,
  setOpen,
}: Readonly<SnackbarProps>) {
  const t = useI18n().messages.dialog;
  // Stays rendered after closing until the slide-out transition ends.
  const [rendered, setRendered] = useState(content.open);
  const timerAutoHide = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (content.open && !rendered) {
    setRendered(true);
  }

  const close = useCallback(
    () => setOpen((prevState) => ({ ...prevState, open: false })),
    [setOpen],
  );

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
    if (!content.open) return;

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
  }, [content.open, close, startTimer, pauseTimer, resumeTimer]);

  // Removes the notice once it has slid out. The transitionend below usually
  // does it; this covers a close during the entrance, when the slide out
  // never runs and no transitionend comes.
  useEffect(() => {
    if (content.open || !rendered) return;
    const timer = setTimeout(() => setRendered(false), 400);
    return () => clearTimeout(timer);
  }, [content.open, rendered]);

  if (!rendered) return null;

  return (
    <div
      className="snackbar"
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      {/* A status, so screen readers announce how the sending went. */}
      <div
        className={`snackbar__content${content.open ? '' : ' snackbar__content--exiting'}`}
        role="status"
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && !content.open) {
            setRendered(false);
          }
        }}
      >
        <span className="snackbar__icon" style={{ color: content.colorIcon }}>
          <content.icon />
        </span>
        <div className="snackbar-message">
          <p className="snackbar-title">{content.title}</p>
          <p className="snackbar-description">{content.description}</p>
        </div>
        <button
          type="button"
          className="snackbar__close"
          aria-label={t.closeNotice}
          onClick={close}
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}
