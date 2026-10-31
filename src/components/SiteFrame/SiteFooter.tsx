// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import { linkTarget, socialIcons } from './content';
import type { SocialLink } from '@/src/content';

interface SiteFooterProps {
  // The address of the home page in the page's language.
  home: string;
  isHome: boolean;
  name: string;
  role: string;
  social: readonly SocialLink[];
  // Comes from the server, so the page and the browser show the same year.
  year: number;
}

export default function SiteFooter({
  home,
  isHome,
  name,
  role,
  social,
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
        <ul className="social-links" aria-label={t.socialLinks}>
          {social.map(({ id, href, text }) => (
            <li key={id}>
              <a
                className="social-links__link"
                href={href}
                {...linkTarget(href)}
                aria-label={text}
              >
                <FontAwesomeIcon icon={socialIcons[id]} />
              </a>
            </li>
          ))}
        </ul>
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
