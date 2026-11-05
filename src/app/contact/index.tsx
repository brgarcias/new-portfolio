// ICONS
import { DownloadIcon, PhoneIcon } from '@/src/components/Icon';
// COMPONENTS
import Feedback from '@/src/components/Feedback';
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
// I18N
import type { Messages } from '@/src/i18n/messages';
// CONTENT
import type {
  Contact as ContactContent,
  SectionHeader,
  SocialLink,
} from '@/src/content';
import {
  linkTarget,
  ResumeShort,
  SocialIcon,
  type Resume,
} from '@/src/components/SiteFrame/content';
// CSS
import './styles.css';

interface ContactProps {
  header: SectionHeader;
  contact: ContactContent;
  social: readonly SocialLink[];
  labels: Messages['contact'];
  frame: Messages['frame'];
  // The résumé in the page's language.
  resume: Resume;
}

// How to reach Bruno: the email first, large, then LinkedIn, GitHub and the
// résumé, and the rest in a quieter line.
export default function Contact({
  header,
  contact,
  social,
  labels,
  frame,
  resume,
}: Readonly<ContactProps>) {
  const channel = (id: SocialLink['id']) =>
    social.find((link) => link.id === id);
  const main = [channel('linkedin'), channel('github')].filter(
    (link) => link !== undefined,
  );
  const whatsapp = channel('whatsapp');

  return (
    <Section header={header} className="contact-section">
      <Reveal className="contact">
        <div className="contact__panel" data-loop>
          <p className="contact__label">{labels.email}</p>
          <a className="contact__email" href={contact.emailHref}>
            {contact.email}
          </a>
          <ul className="contact__links">
            {main.map(({ id, href, text }) => (
              <li key={id}>
                <a className="btn btn--ghost" href={href} {...linkTarget(href)}>
                  <SocialIcon id={id} />
                  {text}
                </a>
              </li>
            ))}
            <li>
              <a
                className="btn btn--ghost"
                href={resume.href}
                download={resume.fileName}
              >
                <span className="resume-label resume-label--full">
                  <DownloadIcon />
                  {labels.resume}
                </span>
                <span className="resume-label resume-label--short">
                  <ResumeShort t={frame} />
                </span>
              </a>
            </li>
          </ul>
          <ul className="contact__quiet" aria-label={labels.channels}>
            {whatsapp && (
              <li>
                <a href={whatsapp.href} {...linkTarget(whatsapp.href)}>
                  <SocialIcon id="whatsapp" />
                  {whatsapp.text}
                </a>
              </li>
            )}
            <li>
              <a href={contact.phoneHref}>
                <PhoneIcon />
                <span className="visually-hidden">{labels.phone}: </span>
                {contact.phone}
              </a>
            </li>
          </ul>
        </div>
        <dl className="contact__facts">
          <div>
            <dt>{labels.location}</dt>
            <dd>
              {contact.location}. {contact.availability}.
            </dd>
          </div>
          <div>
            <dt>{labels.languages}</dt>
            <dd>{contact.languages}.</dd>
          </div>
        </dl>
        <div className="contact__feedback">
          <Feedback label={labels.feedback} />
        </div>
      </Reveal>
    </Section>
  );
}
