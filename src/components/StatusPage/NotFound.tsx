'use client';

// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import StatusPage from '.';
// I18N
import { homePath } from '@/src/i18n/config';
import { useI18n } from '@/src/i18n/I18nProvider';
import { splitLink } from '@/src/i18n/messages';

// The 404 in the language of the page around it, with links back to that
// language's home page. The links load the page again: the 404 renders the
// layout outside the routes, and a navigation inside the app would rebuild
// <html>, losing the theme class.
export default function NotFound() {
  const { locale, messages } = useI18n();
  const t = messages.notFound;
  const home = homePath(locale);
  const { before, link, after } = splitLink(t.text);

  return (
    <StatusPage
      label={t.label}
      code="404"
      title={t.heading}
      description={
        <>
          {before}
          <a href={home}>{link}</a>
          {after}
        </>
      }
      quote={t.quote}
      author={t.author}
      actions={
        <a className="btn btn--primary" href={home}>
          {t.back}
          <FontAwesomeIcon icon={faArrowRight} />
        </a>
      }
    />
  );
}
