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
} from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
// IMAGES
import AboutMeImg from '@/public/images/about-me/about-me.webp';
// COMPONENTS
import ModalComponent from '@/src/components/Modal/Lazy';
import { openOnKey } from '@/src/components/Modal/openOnKey';
import { whenIdle } from '@/src/components/Modal/whenIdle';
import SnackbarFeedback from '@/src/components/SnackBar';
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
import { markup } from '@/src/components/Markup';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import { resume, socialIcons } from '@/src/components/SiteFrame/content';
import type {
  About,
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

// The form only checks strings, and lodash's isEmpty for a string or null
// is the same as this test.
const isEmpty = (value: string | null | undefined) => !value;

interface AboutMeProps {
  header: SectionHeader;
  profile: Profile;
  hero: Hero;
  about: About;
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
  const { messages } = useI18n();
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
  const [errorsState, setErrorsState] = useState({
    fullName: false,
    email: false,
    feedback: false,
  });
  const validateField = (fieldName: string, value: string | null) => {
    setErrorsState((prevState) => ({
      ...prevState,
      [fieldName]: isEmpty(value),
    }));
  };
  const callValidateFields = (formDataParsed: Record<string, string>) => {
    Object.entries(errorsState).map((item) => {
      validateField(item[0], formDataParsed[item[0]]);
    });
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
    callValidateFields(formDataParsed);

    // Only the visitor's fields are required. The form also sends form-name
    // and the bot-field honeypot, which stays empty.
    if (
      Object.keys(errorsState).every((field) => !isEmpty(formDataParsed[field]))
    ) {
      setSubmitting(true);
      validateAndSubmit();
    }
  };

  const openModalFeedback = () => setVisible(true);
  return (
    <>
      <SnackbarFeedback content={openSnackbar} setOpen={setOpenSnackbar} />

      <section id="top" className="hero" aria-labelledby="hero-title">
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

      <Section header={header} className="about">
        <div className="about__grid">
          <Reveal className="about__text">
            <p className="about__lead">{about.lead}</p>
            {about.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Reveal>
          <Reveal className="about__stack" delay={0.12}>
            <h3 className="about__stack-title">{about.stackTitle}</h3>
            <ul className="tag-list">
              {about.technologies.map((name) => (
                <li key={name} className="tag">
                  {name}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

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
