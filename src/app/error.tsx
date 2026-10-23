'use client'; // Error components must be Client Components

// HOOKS
import { useEffect } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import StatusPage from '@/src/components/StatusPage';

// A full reload also sets the stacked-pages menu up again, which re-rendering
// the segment with reset() would not do.
const reload = () => window.location.reload();

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      label="Unexpected Error"
      title="Something Went Wrong"
      description={
        <>
          Sorry, this page stopped working. Please{' '}
          <button className="status-page__link" type="button" onClick={reload}>
            try again
          </button>
          !
        </>
      }
      quote="Failure is simply the opportunity to begin again, this time more intelligently."
      author="Henry Ford"
      action={
        <button
          className="bp-nav__item"
          type="button"
          aria-label="Try again"
          data-info="Try again"
          onClick={reload}
        >
          <FontAwesomeIcon icon={faRotateRight} />
        </button>
      }
    />
  );
}
