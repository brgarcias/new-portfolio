// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
// CONTENT
import { getContactCards } from './cards';
import { socialLinks } from '@/src/components/SiteFrame/content';
// CSS
import './styles.css';

export default function Contact() {
  return (
    <Section
      id="contact"
      description={
        <>
          My personal information, but if you prefer{' '}
          <a
            href="https://api.whatsapp.com/send?phone=5511996969301&text=Hello,%20Bruno!%20Really%20liked%20your%20portfolio."
            target="_blank"
            rel="noopener noreferrer"
          >
            text me
          </a>
          !
        </>
      }
      quote={{
        text: 'Facing suffering will undoubtedly contribute to the elevation of your spiritual practice, provided that you are able to transform calamity and misfortune into a path.',
        author: 'Dalai Lama',
      }}
    >
      <Reveal className="contact">
        <ul className="contact-grid">
          {getContactCards().map((card) => (
            <li
              key={card.id}
              className={`contact-card contact-card--${card.id}`}
            >
              <span className="contact-card__icon" aria-hidden="true">
                <FontAwesomeIcon icon={card.icon} />
              </span>
              <p className="contact-card__label">{card.label}</p>
              <h3 className="contact-card__title">
                {card.titleHref ? (
                  <a href={card.titleHref}>{card.title}</a>
                ) : (
                  card.title
                )}
              </h3>
              <p className="contact-card__subtitle">
                {card.subtitleHref ? (
                  <a href={card.subtitleHref}>{card.subtitle}</a>
                ) : (
                  card.subtitle
                )}
              </p>
              <ul className="contact-card__details">
                {card.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <ul className="contact-links" aria-label="Social links">
          {socialLinks.map(({ icon, href, text }) => (
            <li key={text}>
              <a
                className="btn btn--ghost"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={icon} />
                {text}
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
