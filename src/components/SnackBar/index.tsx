// REACT UTILS
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
// FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
// CSS
import './styles.css';

type Content = {
  open: boolean;
  title: string;
  description: string;
  icon: IconProp;
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

  if (!rendered) return null;

  return (
    <div
      className="snackbar"
      role="presentation"
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      <div
        className={`snackbar__content${content.open ? '' : ' snackbar__content--exiting'}`}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && !content.open) {
            setRendered(false);
          }
        }}
      >
        <FontAwesomeIcon
          icon={content.icon}
          style={{
            color: content.colorIcon,
            marginTop: '5px',
          }}
        />
        <div className="snackbar-message">
          <p className="snackbar-title">{content.title}</p>
          <p className="snackbar-description" style={{ fontSize: '0.8rem' }}>
            {content.description}
          </p>
        </div>
        <div onClick={close} style={{ cursor: 'pointer' }}>
          <i className="fa-light fa-xmark"></i>
        </div>
      </div>
    </div>
  );
}
