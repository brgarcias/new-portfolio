// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faGraduationCap,
  faLanguage,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
// CONTENT
import type { ContactCard, SectionHeader, SocialLink } from '@/src/content';
import { socialIcons } from '@/src/components/SiteFrame/content';
// CSS
import './styles.css';

const icons = {
  profile: faUser,
  education: faGraduationCap,
  contact: faEnvelope,
  languages: faLanguage,
};

interface ContactProps {
  header: SectionHeader;
  cards: readonly ContactCard[];
  social: readonly SocialLink[];
}

export default function Contact({
  header,
  cards,
  social,
}: Readonly<ContactProps>) {
  return (
    <Section header={header}>
      <Reveal className="contact">
        <ul className="contact-grid">
          {cards.map((card) => (
            <li
              key={card.id}
              className={`contact-card contact-card--${card.id}`}
            >
              <span className="contact-card__icon" aria-hidden="true">
                <FontAwesomeIcon icon={icons[card.id]} />
              </span>
              <p className="contact-card__label">{card.label}</p>
              <h3 className="contact-card__title">
                {'titleHref' in card ? (
                  <a href={card.titleHref}>{card.title}</a>
                ) : (
                  card.title
                )}
              </h3>
              <p className="contact-card__subtitle">
                {'subtitleHref' in card ? (
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
          {social.map(({ id, href, text }) => (
            <li key={id}>
              <a
                className="btn btn--ghost"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={socialIcons[id]} />
                {text}
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
