// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
// CONTENT
import { socialLinks } from './content';

interface SiteFooterProps {
  isHome: boolean;
  // Comes from the server, so the page and the browser show the same year.
  year: number;
}

export default function SiteFooter({
  isHome,
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
            <span className="site-brand__name">Bruno Garcia</span>
          </a>
          <p className="site-footer__role">Full-Stack Developer</p>
        </div>
        <ul className="social-links" aria-label="Social links">
          {socialLinks.map(({ icon, href, text }) => (
            <li key={text}>
              <a
                className="social-links__link"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={text}
              >
                <FontAwesomeIcon icon={icon} />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="site-footer__bottom">
        <p>
          © <span className="site-footer__year">{year}</span> Bruno Garcia
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
