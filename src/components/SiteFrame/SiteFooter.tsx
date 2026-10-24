// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
// CONTENT
import { socialIcons } from './content';
import type { SocialLink } from '@/src/content';

interface SiteFooterProps {
  isHome: boolean;
  name: string;
  role: string;
  social: readonly SocialLink[];
  // Comes from the server, so the page and the browser show the same year.
  year: number;
}

export default function SiteFooter({
  isHome,
  name,
  role,
  social,
  year,
}: Readonly<SiteFooterProps>) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <a className="site-brand" href={isHome ? '#top' : '/'}>
            <span className="site-brand__mark" aria-hidden="true">
              BG
            </span>
            <span className="site-brand__name">{name}</span>
          </a>
          <p className="site-footer__role">{role}</p>
        </div>
        <ul className="social-links" aria-label="Social links">
          {social.map(({ id, href, text }) => (
            <li key={id}>
              <a
                className="social-links__link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
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
            Back to top
            <FontAwesomeIcon icon={faArrowUp} />
          </a>
        )}
      </div>
    </footer>
  );
}
