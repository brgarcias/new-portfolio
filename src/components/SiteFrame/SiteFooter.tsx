// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';

interface SiteFooterProps {
  // The address of the home page in the page's language.
  home: string;
  isHome: boolean;
  name: string;
  role: string;
  // Comes from the server, so the page and the browser show the same year.
  year: number;
}

// The end of every page: the signature, the year and, on the home page, the
// way back to the top. The channels are in the contact section, just above.
export default function SiteFooter({
  home,
  isHome,
  name,
  role,
  year,
}: Readonly<SiteFooterProps>) {
  const t = useI18n().messages.frame;

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <a className="site-brand" href={isHome ? '#top' : home}>
            <span className="site-brand__mark" aria-hidden="true">
              BG
            </span>
            <span className="site-brand__name">{name}</span>
          </a>
          <p className="site-footer__role">{role}</p>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>
          © <span className="site-footer__year">{year}</span> {name}
        </p>
        {isHome && (
          <a className="site-footer__top" href="#top">
            {t.backToTop}
            <FontAwesomeIcon icon={faArrowUp} />
          </a>
        )}
      </div>
    </footer>
  );
}
