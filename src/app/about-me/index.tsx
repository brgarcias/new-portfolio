// NEXT
import Image from 'next/image';
// REACT
import type { CSSProperties } from 'react';
// FONTAWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowRight,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
// IMAGES
import AboutMeImg from '@/public/images/about-me/about-me.webp';
// COMPONENTS
import About from './About';
import SocialLinks from '@/src/components/SiteFrame/SocialLinks';
import { markup } from '@/src/components/Markup';
// I18N
import { format, type Messages } from '@/src/i18n/messages';
// CONTENT
import { resume } from '@/src/components/SiteFrame/content';
import type {
  About as AboutContent,
  Hero,
  Profile,
  SectionHeader,
  SocialLink,
} from '@/src/content';
// CSS
import './styles.css';

interface AboutMeProps {
  header: SectionHeader;
  profile: Profile;
  hero: Hero;
  about: AboutContent;
  social: readonly SocialLink[];
  // The texts of the buttons, in the page's language.
  t: Messages['hero'];
  // The game's page, in the page's language.
  playHref: string;
  // The experience without an end date, shown under the tagline.
  currentRole?: { title: string; company: string };
}

// Each element enters a little after the previous one.
const order = (i: number) => ({ '--i': i }) as CSSProperties;

// The top of the home page, then the About section. Rendered on the server:
// nothing here needs the browser.
export default function AboutMe({
  header,
  profile,
  hero,
  about,
  social,
  t,
  playHref,
  currentRole,
}: Readonly<AboutMeProps>) {
  return (
    <>
      <section id="top" className="hero" aria-labelledby="hero-title">
        <div className="hero__inner">
          <div className="hero__content">
            <p className="hero__name hero__reveal">{profile.name}</p>
            {/* A **highlight** in a line of the title takes the brand's
                color. */}
            <h1 id="hero-title" className="hero__title">
              <span className="hero__title-line hero__reveal" style={order(1)}>
                {markup(hero.titleTop, 'hero__title-accent')}
              </span>{' '}
              <span className="hero__title-line hero__reveal" style={order(2)}>
                {markup(hero.titleBottom, 'hero__title-accent')}
              </span>
            </h1>
            <p className="hero__tagline hero__reveal" style={order(3)}>
              {hero.tagline}
            </p>
            {currentRole && (
              <p className="hero__status hero__reveal" style={order(4)}>
                {format(t.currently, {
                  role: currentRole.title,
                  company: currentRole.company,
                })}
              </p>
            )}
            <div className="hero__actions hero__reveal" style={order(5)}>
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
              <a className="btn btn--ghost" href={playHref}>
                <FontAwesomeIcon icon={faRocket} />
                {t.play}
              </a>
            </div>
            <div className="hero__reveal" style={order(6)}>
              <SocialLinks links={social} className="hero__social" />
            </div>
          </div>

          <figure className="hero__visual">
            <Image
              className="hero__image"
              src={AboutMeImg}
              alt={profile.name}
              unoptimized
              priority
            />
            {/* The technologies of the day to day, under the illustration. */}
            <figcaption>
              <ul className="hero__stack">
                {hero.highlights.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </figcaption>
          </figure>
        </div>
      </section>

      <About header={header} about={about} />
    </>
  );
}
