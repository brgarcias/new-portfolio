'use client';

// NEXT
import Image from 'next/image';
import dynamic from 'next/dynamic';
// HOOKS
import { CSSProperties, FormEvent, useEffect, useState } from 'react';
// FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowRight,
  faCheck,
  faCircleExclamation,
  faComment,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
// IMAGES
import AboutMeImg from '@/public/images/about-me/about-me.webp';
// COMPONENTS
import ModalComponent from '@/src/components/Modal/Lazy';
import { openOnKey } from '@/src/components/Modal/openOnKey';
import { whenIdle } from '@/src/components/Modal/whenIdle';
import SnackbarFeedback from '@/src/components/SnackBar';
import About from './About';
import { markup } from '@/src/components/Markup';
import { fields, isValidField } from '@/src/components/Form/utils';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { pagePath } from '@/src/i18n/config';
import { format } from '@/src/i18n/messages';
// CONTENT
import {
  resume,
  linkTarget,
  socialIcons,
} from '@/src/components/SiteFrame/content';
import type {
  About as AboutContent,
  Hero,
  Profile,
  SectionHeader,
  SocialLink,
} from '@/src/content';
// CSS
import './styles.css';

// The feedback form uses HeroUI's fields, so it loads like the dialog: when
// the browser is idle after the page, or when the dialog opens.
const loadForm = () => import('@/src/components/Form');
const Form = dynamic(loadForm, { ssr: false });

const noErrors = { fullName: false, email: false, feedback: false };

interface AboutMeProps {
  header: SectionHeader;
  profile: Profile;
  hero: Hero;
  about: AboutContent;
  social: readonly SocialLink[];
  // The experience without an end date, shown under the name.
  currentRole?: { title: string; company: string };
}

export default function AboutMe({
  header,
  profile,
  hero,
  about,
  social,
  currentRole,
}: Readonly<AboutMeProps>) {
  const { locale, messages } = useI18n();
  const t = messages.hero;
  const tf = messages.feedback;
  const [visible, setVisible] = useState(false);
  const [fullNameValue, setFullNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [feedbackValue, setFeedbackValue] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    title: '',
    description: '',
    icon: faCheck as IconProp,
    colorIcon: '',
  });

  useEffect(() => whenIdle(() => void loadForm()), []);
  const [errorsState, setErrorsState] = useState(noErrors);
  const validateField = (fieldName: string, value: string | null) => {
    setErrorsState((prevState) => ({
      ...prevState,
      [fieldName]: !isValidField(fieldName, value),
    }));
  };

  const submitForm = async (data: FormEvent<HTMLFormElement>) => {
    data.preventDefault();
    const formData = new FormData(data.currentTarget);
    const formDataParsed: Record<string, string> = {};

    formData.forEach(function (value, index) {
      formDataParsed[index] = value.toString();
    });

    const validateAndSubmit = async () => {
      try {
        // Netlify Forms only accepts submissions posted to a static file.
        // A POST to / reaches the Next.js server and the message is lost.
        const response = await fetch('/contact.html', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formDataParsed).toString(),
        });

        if (response.ok) {
          setOpenSnackbar({
            open: true,
            title: tf.sentTitle,
            description: tf.sentText,
            icon: faCheck,
            colorIcon: 'var(--color-success)',
          });
        } else {
          console.error('Error on sending forms: ', response);
          throw new Error('An error occurred while sending your message');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        setOpenSnackbar({
          open: true,
          title: tf.failedTitle,
          description: tf.failedText,
          icon: faCircleExclamation,
          colorIcon: 'var(--color-error)',
        });
      } finally {
        setSubmitting(false);
        setVisible(false);
      }
    };
    // Only the visitor's fields are required. The form also sends form-name
    // and the bot-field honeypot, which stays empty. Every field is checked,
    // the email's format included.
    const wrong = fields.filter(
      (field) => !isValidField(field, formDataParsed[field]),
    );
    setErrorsState({
      fullName: wrong.includes('fullName'),
      email: wrong.includes('email'),
      feedback: wrong.includes('feedback'),
    });
    if (wrong.length) return;
    setSubmitting(true);
    validateAndSubmit();
  };

  // The form opens with its fields empty, so without the errors of the last
  // time it was open.
  const openModalFeedback = () => {
    setErrorsState(noErrors);
    setVisible(true);
  };
  return (
    <>
      <SnackbarFeedback content={openSnackbar} setOpen={setOpenSnackbar} />

      <section id="top" className="hero" aria-labelledby="hero-title" data-loop>
        <div className="hero__backdrop" aria-hidden="true">
          <span className="hero__glow hero__glow--brand" />
          <span className="hero__glow hero__glow--violet" />
          <span className="hero__glow hero__glow--cyan" />
          <span className="hero__grid" />
        </div>

        <div className="hero__inner">
          <div className="hero__content">
            {currentRole && (
              <p className="hero__status hero__reveal">
                <span className="hero__status-dot" aria-hidden="true" />
                {format(t.currently, {
                  role: currentRole.title,
                  company: currentRole.company,
                })}
              </p>
            )}
            <p
              className="hero__name hero__reveal"
              style={{ '--i': 1 } as CSSProperties}
            >
              {profile.name}
            </p>
            {/* A **highlight** in a line of the title takes the gradient. */}
            <h1 id="hero-title" className="hero__title">
              <span
                className="hero__title-line hero__reveal"
                style={{ '--i': 2 } as CSSProperties}
              >
                {markup(hero.titleTop, 'hero__title-accent')}
              </span>{' '}
              <span
                className="hero__title-line hero__reveal"
                style={{ '--i': 3 } as CSSProperties}
              >
                {markup(hero.titleBottom, 'hero__title-accent')}
              </span>
            </h1>
            <p
              className="hero__tagline hero__reveal"
              style={{ '--i': 4 } as CSSProperties}
            >
              {hero.tagline}
            </p>
            <div
              className="hero__actions hero__reveal"
              style={{ '--i': 5 } as CSSProperties}
            >
              <a className="btn btn--primary" href="#contact">
                {t.contact}
                <FontAwesomeIcon icon={faArrowRight} />
              </a>
              <a
                className="btn btn--ghost"
                href={resume.href}
                download={resume.fileName}
              >
                <FontAwesomeIcon icon={faArrowDown} />
                {t.downloadCv}
              </a>
              <a className="btn btn--ghost" href={pagePath(locale, 'play')}>
                <FontAwesomeIcon icon={faRocket} />
                {t.play}
              </a>
              <button
                type="button"
                className="btn btn--text"
                onClick={openModalFeedback}
                onKeyDown={openOnKey(openModalFeedback)}
              >
                <FontAwesomeIcon icon={faComment} />
                {t.feedback}
              </button>
            </div>
            <ul
              className="social-links hero__social hero__reveal"
              style={{ '--i': 6 } as CSSProperties}
            >
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

          <div className="hero__visual">
            <div className="hero__halo" aria-hidden="true" />
            <div className="hero__float">
              <Image
                className="hero__image"
                src={AboutMeImg}
                alt={profile.name}
                unoptimized
                priority
              />
            </div>
            <ul className="hero__chips" aria-hidden="true">
              {hero.highlights.map((name, index) => (
                <li
                  key={name}
                  className="hero__chip"
                  style={{ '--i': index } as CSSProperties}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <a className="hero__scroll" href="#about">
          <span className="hero__mouse" aria-hidden="true">
            <span />
          </span>
          <span className="visually-hidden">{t.scrollToAbout}</span>
        </a>
      </section>

      <About header={header} about={about} />

      <ModalComponent
        title={tf.title}
        subtitle={tf.subtitle}
        visible={visible}
        setVisible={setVisible}
        size="md"
        hideCloseButton
      >
        <Form
          submitForm={submitForm}
          isSubmitting={isSubmitting}
          formData={{
            emailValue,
            feedbackValue,
            fullNameValue,
            setEmailValue,
            setFeedbackValue,
            setFullNameValue,
          }}
          validateField={validateField}
          onClose={() => setVisible(false)}
          actionButtonDisabled={isSubmitting}
          errorsState={errorsState}
        />
      </ModalComponent>
    </>
  );
}
