// NEXT
import Image from 'next/image';
// HOOKS
import type { CSSProperties } from 'react';
// ICONS
import {
  ArrowRightIcon,
  DownloadIcon,
  RocketIcon,
} from '@/src/components/Icon';
// IMAGES
import AboutMeImg from '@/public/images/about-me/about-me.webp';
// COMPONENTS
import { markup } from '@/src/components/Markup';
// I18N
import { format, type Messages } from '@/src/i18n/messages';
// CONTENT
import {
  resume,
  linkTarget,
  SocialIcon,
} from '@/src/components/SiteFrame/content';
import type { Hero as HeroContent, Profile, SocialLink } from '@/src/content';
// CSS
import './styles.css';

interface HeroProps {
  profile: Profile;
  hero: HeroContent;
  social: readonly SocialLink[];
  // The experience without an end date, shown over the name.
  currentRole?: { title: string; company: string };
  t: Messages['hero'];
  // The address of the game, in the page's language.
  playHref: string;
}

// The leader of each technology around the illustration, like the callouts of
// a technical drawing: from the middle of its label to a dot on the drawing,
// in the image's own proportions (567 × 490).
const leaders = [
  { path: 'M10 6 H38 V25.5', dot: [38, 25.5] },
  { path: 'M89 13 H72 V20', dot: [72, 20] },
  { path: 'M2 40.5 H13', dot: [13, 40.5] },
  { path: 'M96 47.5 H86', dot: [86, 47.5] },
  { path: 'M13 76.5 H24 V64', dot: [24, 64] },
  { path: 'M80 81.5 V72', dot: [80, 72] },
];

// The top of the page: who Bruno is and what he builds, the way to his work,
// and where he has done it. On the server, as nothing here needs the browser,
// so the page's first screen comes with less JavaScript.
export default function Hero({
  profile,
  hero,
  social,
  currentRole,
  t,
  playHref,
}: Readonly<HeroProps>) {
  return (
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
            <span className="hero__title-line hero__reveal">
              {markup(hero.titleTop, 'hero__title-accent')}
            </span>{' '}
            <span className="hero__title-line hero__reveal">
              {markup(hero.titleBottom, 'hero__title-accent')}
            </span>
          </h1>
          <p
            className="hero__tagline hero__reveal"
            style={{ '--i': 2 } as CSSProperties}
          >
            {hero.tagline}
          </p>
          <div
            className="hero__actions hero__reveal"
            style={{ '--i': 3 } as CSSProperties}
          >
            <a className="btn btn--primary" href="#projects">
              {t.work}
              <ArrowRightIcon />
            </a>
            <a
              className="btn btn--ghost"
              href={resume.href}
              download={resume.fileName}
            >
              <DownloadIcon />
              {t.downloadCv}
            </a>
            <a className="btn btn--ghost" href="#contact">
              {t.contact}
            </a>
          </div>
          <div
            className="hero__links hero__reveal"
            style={{ '--i': 4 } as CSSProperties}
          >
            <ul className="social-links">
              {social.map(({ id, href, text }) => (
                <li key={id}>
                  <a
                    className="social-links__link"
                    href={href}
                    {...linkTarget(href)}
                    aria-label={text}
                  >
                    <SocialIcon id={id} />
                  </a>
                </li>
              ))}
            </ul>
            <a className="hero__play" href={playHref}>
              <RocketIcon />
              {t.play}
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__halo" aria-hidden="true" />
          <div className="hero__float">
            <Image
              className="hero__image"
              src={AboutMeImg}
              alt={format(t.illustration, { name: profile.name })}
              unoptimized
              priority
            />
            <svg
              className="hero__leaders"
              viewBox="0 0 100 86.4"
              aria-hidden="true"
              focusable="false"
            >
              {leaders.map(({ path, dot }, index) => (
                <g key={path} style={{ '--i': index } as CSSProperties}>
                  <path d={path} pathLength="1" />
                  <circle cx={dot[0]} cy={dot[1]} r="0.65" />
                </g>
              ))}
            </svg>
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
      </div>

      <div
        className="hero__proof hero__reveal"
        style={{ '--i': 5 } as CSSProperties}
      >
        <p className="hero__proof-label">{hero.companiesLabel}</p>
        <ul className="hero__companies">
          {hero.companies.map((company) => (
            <li key={company}>{company}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
