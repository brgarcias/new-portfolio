// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
import Feedback from '@/src/components/Feedback';
import SocialLinks from '@/src/components/SiteFrame/SocialLinks';
// CONTENT
import type { ContactCard, SectionHeader, SocialLink } from '@/src/content';
// CSS
import './styles.css';

interface ContactProps {
  header: SectionHeader;
  cards: readonly ContactCard[];
  social: readonly SocialLink[];
  // The name of the list of social buttons, for screen readers.
  socialLabel: string;
}

// An address that does not fit on its line breaks before its @, not after
// the hyphen of its name. <wbr> adds no character to copy.
function addressText(text: string) {
  const at = text.indexOf('@');
  if (at < 1) return text;
  return (
    <>
      {text.slice(0, at)}
      <wbr />
      {text.slice(at)}
    </>
  );
}

// What a card says: its label, a title and a line under it, each a link
// when the content gives one, and the details.
function CardText({ card }: Readonly<{ card: ContactCard }>) {
  return (
    <>
      <p className="contact-card__label">{card.label}</p>
      <h3 className="contact-card__title">
        {'titleHref' in card ? (
          <a href={card.titleHref}>{addressText(card.title)}</a>
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
    </>
  );
}

// How to reach Bruno comes first, on its own panel, with the channels and
// the way to leave a comment on the portfolio; beside it, the facts the old
// contact card had in tabs: profile, education and languages.
export default function Contact({
  header,
  cards,
  social,
  socialLabel,
}: Readonly<ContactProps>) {
  const reach = cards.find((card) => card.id === 'contact');
  const facts = cards.filter((card) => card.id !== 'contact');

  return (
    <Section header={header}>
      <div className="contact">
        {reach && (
          <Reveal className="contact__reach">
            <div className="contact-card contact-card--contact">
              <CardText card={reach} />
            </div>
            <SocialLinks
              links={social}
              variant="buttons"
              className="contact-links"
              label={socialLabel}
            />
            <Feedback />
          </Reveal>
        )}
        <Reveal className="contact__facts" delay={0.08}>
          <ul className="contact-facts">
            {facts.map((card) => (
              <li
                key={card.id}
                className={`contact-card contact-card--${card.id}`}
              >
                <CardText card={card} />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
