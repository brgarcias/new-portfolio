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
// CONTENT
import { resume, socialLinks } from '@/src/components/SiteFrame/content';
// CSS
import './styles.css';

// The feedback form uses HeroUI's fields, so it loads like the dialog: when
// the browser is idle after the page, or when the dialog opens.
const loadForm = () => import('@/src/components/Form');
const Form = dynamic(loadForm, { ssr: false });

// The form only checks strings, and lodash's isEmpty for a string or null
// is the same as this test.
const isEmpty = (value: string | null | undefined) => !value;

// Technologies named in the second paragraph below.
const technologies = [
  'PHP',
  'CodeIgniter',
  'Laravel',
  'GraphQL',
  'REST APIs',
  'ReactJS',
  'NextJS',
  'NodeJS',
  'NestJS',
  'Python',
  'MySQL',
  'Postgres',
  'Jira',
  'AWS',
];

// A few of them float around the illustration.
const highlights = ['ReactJS', 'NextJS', 'NodeJS', 'NestJS', 'GraphQL', 'AWS'];

interface AboutMeProps {
  // The experience without an end date, shown under the name.
  currentRole?: { title: string; company: string };
}

export default function AboutMe({ currentRole }: Readonly<AboutMeProps>) {
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
            title: 'Message Submitted',
            description: 'Thank you very much for your feedback!',
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
          title: 'We had a problem',
          description: 'An error occurred while sending your message!',
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
                Currently {currentRole.title} at {currentRole.company}
              </p>
            )}
            <p
              className="hero__name hero__reveal"
              style={{ '--i': 1 } as CSSProperties}
            >
              Bruno Garcia
            </p>
            <h1 id="hero-title" className="hero__title">
              <span
                className="hero__title-line hero__reveal"
                style={{ '--i': 2 } as CSSProperties}
              >
                <span className="hero__title-accent">Full-Stack</span>
              </span>{' '}
              <span
                className="hero__title-line hero__reveal"
                style={{ '--i': 3 } as CSSProperties}
              >
                Developer
              </span>
            </h1>
            <p
              className="hero__tagline hero__reveal"
              style={{ '--i': 4 } as CSSProperties}
            >
              Passionate about development, eager for new experiences and
              constantly seeking fresh challenges.
            </p>
            <div
              className="hero__actions hero__reveal"
              style={{ '--i': 5 } as CSSProperties}
            >
              <a className="btn btn--primary" href="#contact">
                Contact me
                <FontAwesomeIcon icon={faArrowRight} />
              </a>
              <a
                className="btn btn--ghost"
                href={resume.href}
                download={resume.fileName}
              >
                <FontAwesomeIcon icon={faArrowDown} />
                Download CV
              </a>
              <button
                type="button"
                className="btn btn--text"
                onClick={openModalFeedback}
                onKeyDown={openOnKey(openModalFeedback)}
              >
                <FontAwesomeIcon icon={faComment} />
                Leave Feedback
              </button>
            </div>
            <ul
              className="social-links hero__social hero__reveal"
              style={{ '--i': 6 } as CSSProperties}
            >
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

          <div className="hero__visual">
            <div className="hero__halo" aria-hidden="true" />
            <div className="hero__float">
              <Image
                className="hero__image"
                src={AboutMeImg}
                alt="Bruno Garcia"
                unoptimized
                priority
              />
            </div>
            <ul className="hero__chips" aria-hidden="true">
              {highlights.map((name, index) => (
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
          <span className="visually-hidden">Scroll to About Me</span>
        </a>
      </section>

      <Section id="about" className="about">
        <div className="about__grid">
          <Reveal className="about__text">
            <p className="about__lead">
              Passionate and experienced Full Stack Developer with a solid track
              record spanning several years in programming, coordinating, and
              supervising various types of projects. I am an enthusiast for
              comprehensive project lifecycle management, from conception to
              implementation, mastering all stages of advanced development.
              Maintaining a high level of attention to detail and the ability to
              concurrently manage multiple projects. My experience extends to
              building strong and productive relationships with clients and team
              members, always with a total focus on customer satisfaction and
              project success.
            </p>
            <p>
              My proficiency covers a wide range of technologies, including PHP
              with frameworks like CodeIgniter and Laravel, GraphQL and REST
              APIs, ReactJS and NextJS, NodeJS and NestJS, Python, as well as
              experience with MySQL and Postgres databases. I am also competent
              in essential tools like Jira and AWS. I am capable of
              self-managing effectively in independent projects while also
              collaborating productively in team environments.
            </p>
            <p>
              I am committed to driving the success of every project I&apos;m
              involved in, and I&apos;m always eager to explore new
              opportunities and challenges in the field of software development.
            </p>
          </Reveal>
          <Reveal className="about__stack" delay={0.12}>
            <h3 className="about__stack-title">Technologies &amp; tools</h3>
            <ul className="tag-list">
              {technologies.map((name) => (
                <li key={name} className="tag">
                  {name}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <ModalComponent
        title="Welcome!"
        subtitle="Please share your thoughts and feedback to help me improve my portfolio."
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
