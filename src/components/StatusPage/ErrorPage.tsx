'use client';

// HOOKS
import { useEffect } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import StatusPage from '@/src/components/StatusPage';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { splitLink } from '@/src/i18n/messages';

// A full reload also hooks the bar up to the new sections again, which
// re-rendering the segment with reset() would not do.
const reload = () => window.location.reload();

// The page shown when a page or the layout fails. The error.tsx files of
// the routes render it, as does src/app/global-error.tsx.
export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const t = useI18n().messages.error;
  const { before, link, after } = splitLink(t.text);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      label={t.label}
      title={t.heading}
      description={
        <>
          {before}
          <button className="status-page__link" type="button" onClick={reload}>
            {link}
          </button>
          {after}
        </>
      }
      quote={t.quote}
      author={t.author}
      actions={
        <button className="btn btn--primary" type="button" onClick={reload}>
          <FontAwesomeIcon icon={faRotateRight} />
          {t.retry}
        </button>
      }
    />
  );
}
