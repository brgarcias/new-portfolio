'use client';

// NEXT
import Image, { type StaticImageData } from 'next/image';
// HOOKS
import {
  CSSProperties,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
import ModalComponent from '@/src/components/Modal/Lazy';
import { openOnKey } from '@/src/components/Modal/openOnKey';
import Cases from './Cases';
// DEVICES
import iPhoneImg from '@/public/images/projects/iphone.webp';
import iPadImg from '@/public/images/projects/ipad.webp';
import MacbookImg from '@/public/images/projects/macbook.webp';
import iMacImg from '@/public/images/projects/imac.webp';
import AppleWatchImg from '@/public/images/projects/apple-watch.webp';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import type { CaseStudy, Project, SectionHeader } from '@/src/content';
// CSS
import './styles.css';

// The frame of each device a project can be shown in, and where its screen
// sits in the frame's image, in that image's pixels: left, top, width and
// height, and the radius of the watch's rounded screen.
const devices = {
  iphone: { frame: iPhoneImg, screen: [35, 80, 114, 200], radius: 0 },
  ipad: { frame: iPadImg, screen: [46, 80, 151, 201], radius: 0 },
  macbook: { frame: MacbookImg, screen: [52, 80, 319, 201], radius: 0 },
  imac: { frame: iMacImg, screen: [64, 84, 318, 190], radius: 0 },
  watch: { frame: AppleWatchImg, screen: [22, 117, 107, 126], radius: 12 },
} satisfies Record<
  string,
  {
    frame: StaticImageData;
    screen: [number, number, number, number];
    radius: number;
  }
>;

// The preview fills the screen, which the device's box frames exactly.
function screenStyle(device: keyof typeof devices): CSSProperties {
  const { frame, screen, radius } = devices[device];
  const [left, top, width, height] = screen;
  const percent = (value: number, total: number) => `${(value / total) * 100}%`;
  return {
    left: percent(left, frame.width),
    top: percent(top, frame.height),
    width: percent(width, frame.width),
    height: percent(height, frame.height),
    borderRadius: radius || undefined,
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

// The device leans towards the mouse, with a light following it. Touch and
// pen leave it still, and "reduce motion" turns the effect off in CSS.
function tilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse') return;
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  card.style.setProperty('--tilt-x', `${(-y * 10).toFixed(2)}deg`);
  card.style.setProperty('--tilt-y', `${(x * 14).toFixed(2)}deg`);
  card.style.setProperty('--glare-x', `${((x + 0.5) * 100).toFixed(1)}%`);
  card.style.setProperty('--glare-y', `${((y + 0.5) * 100).toFixed(1)}%`);
}

function untilt(event: PointerEvent<HTMLElement>) {
  for (const name of ['--tilt-x', '--tilt-y', '--glare-x', '--glare-y']) {
    event.currentTarget.style.removeProperty(name);
  }
}

interface ProjectsProps {
  header: SectionHeader;
  // The case studies, before the websites.
  cases: CaseStudy[];
  projects: Project[];
}

export default function Projects({
  header,
  cases,
  projects,
}: Readonly<ProjectsProps>) {
  const t = useI18n().messages.projects;
  const trackRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const total = projects.length;
  const project = projects[selected];

  // The card the arrows sent the track to, while it glides there.
  const gliding = useRef<{ index: number; until: number } | null>(null);

  // The card at the start of the track is the current one, whether the
  // visitor swiped, scrolled or used the arrows. While the track glides to a
  // card, the positions on the way do not count, until the scroll ends.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    let recheck = 0;
    const update = (ended: boolean) => {
      frame = 0;
      const glide = gliding.current;
      const left = glide ? glide.until - performance.now() : 0;
      if (glide && !ended && left > 0) {
        // Looks again when the glide is over, in case no scrollend comes,
        // as when a swipe interrupts the glide.
        window.clearTimeout(recheck);
        recheck = window.setTimeout(() => update(true), left);
        return;
      }
      window.clearTimeout(recheck);
      gliding.current = null;
      const first = track.firstElementChild as HTMLElement | null;
      if (!first) return;
      const step =
        first.offsetWidth +
        Number.parseFloat(getComputedStyle(track).columnGap);
      const index = Math.round(track.scrollLeft / step);
      setCurrent(Math.min(Math.max(index, 0), total - 1));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(() => update(false));
    };
    const onScrollEnd = () => update(true);
    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('scrollend', onScrollEnd);
    return () => {
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('scrollend', onScrollEnd);
      cancelAnimationFrame(frame);
      window.clearTimeout(recheck);
    };
  }, [total]);

  // The arrows go around: past the last project comes the first. Quick
  // clicks count from the card the track is still gliding to.
  const go = (step: number) => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const glide = gliding.current;
    const from =
      glide && performance.now() < glide.until ? glide.index : current;
    const target = (from + step + total) % total;
    const card = track.children[target] as HTMLElement;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    gliding.current = { index: target, until: performance.now() + 1000 };
    track.scrollTo({
      left: card.offsetLeft - first.offsetLeft,
      behavior: reduced ? 'auto' : 'smooth',
    });
    setCurrent(target);
  };

  const openDetails = (index: number) => {
    setSelected(index);
    setDetailsOpen(true);
  };

  return (
    <Section header={header}>
      <Cases cases={cases} />
      <h3 className="projects__group">{t.websites}</h3>
      <Reveal className="projects">
        {/* Swiping scrolls the track. With the keyboard, each card's button
            scrolls its card into view when it gets focus. */}
        <ul ref={trackRef} className="projects__track" aria-label={t.list}>
          {projects.map((item, index) => (
            <li
              key={item.slug}
              className="project-card"
              aria-current={index === current ? 'true' : undefined}
              onPointerMove={tilt}
              onPointerLeave={untilt}
            >
              <div className="project-card__stage">
                <div className="project-card__float">
                  <div className="project-card__device">
                    <Image
                      className="project-card__frame"
                      src={devices[item.device].frame}
                      alt=""
                      unoptimized
                    />
                    <div
                      className="project-card__screen"
                      style={screenStyle(item.device)}
                    >
                      <Image
                        src={item.preview.src}
                        width={item.preview.width}
                        height={item.preview.height}
                        alt={item.title}
                        unoptimized
                      />
                    </div>
                  </div>
                </div>
                <span className="project-card__glare" aria-hidden="true" />
              </div>

              <div className="project-card__body">
                <p className="project-card__eyebrow">
                  <span aria-hidden="true">{pad(index + 1)}</span>
                  {item.eyebrow}
                </p>
                <h3 className="project-card__title">{item.title}</h3>
                {/* The button covers the whole card. */}
                <button
                  type="button"
                  className="project-card__cta"
                  aria-haspopup="dialog"
                  onClick={() => openDetails(index)}
                  onKeyDown={openOnKey(() => openDetails(index))}
                >
                  {t.details}
                  <span className="visually-hidden">
                    {format(t.detailsAbout, { title: item.title })}
                  </span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="projects__controls">
          <p className="projects__counter" aria-hidden="true">
            <span>{pad(current + 1)}</span> / {pad(total)}
          </p>
          <span className="projects__progress" aria-hidden="true">
            <span style={{ transform: `scaleX(${(current + 1) / total})` }} />
          </span>
          <div className="projects__arrows">
            <button
              type="button"
              className="projects__arrow"
              aria-label={t.previous}
              onClick={() => go(-1)}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <button
              type="button"
              className="projects__arrow"
              aria-label={t.next}
              onClick={() => go(1)}
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </Reveal>

      {/* Rendered only while open, so its large image loads on demand. */}
      <ModalComponent
        visible={detailsOpen}
        setVisible={setDetailsOpen}
        size="5xl"
        title={project.dialogTitle}
        subtitle={project.dialogSubtitle}
      >
        <div className="project-details">
          <Image
            className="project-details__image"
            src={project.image.src}
            width={project.image.width}
            height={project.image.height}
            alt={project.dialogTitle}
            unoptimized
          />
          <div className="project-details__text">
            <p>{project.description}</p>
            <a
              className="btn btn--primary btn--small"
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.website}
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
            </a>
          </div>
        </div>
      </ModalComponent>
    </Section>
  );
}
