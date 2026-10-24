'use client';

// NEXT
import Image from 'next/image';
// HOOKS
import { useEffect, useState } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faExpand,
} from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
import ModalComponent from '@/src/components/Modal/Lazy';
import { openOnKey } from '@/src/components/Modal/openOnKey';
import { markup } from '@/src/components/Markup';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type {
  Contributing as ContributingContent,
  Initiative,
  SectionHeader,
} from '@/src/content';
// CSS
import './styles.css';

const pad = (value: number) => String(value).padStart(2, '0');
// The viewer goes around: after the last photo comes the first.
const wrap = (index: number, step: number, total: number) =>
  (index + step + total) % total;

interface ContributingProps {
  header: SectionHeader;
  content: ContributingContent;
  initiatives: Initiative[];
}

export default function Contributing({
  header,
  content,
  initiatives,
}: Readonly<ContributingProps>) {
  const t = useI18n().messages.contributing;
  const [selected, setSelected] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const total = initiatives.length;
  const photo = initiatives[selected];

  const open = (index: number) => {
    setSelected(index);
    setViewerOpen(true);
  };

  const go = (step: number) => setSelected((index) => wrap(index, step, total));

  // The arrow keys browse the photos while the viewer is open.
  useEffect(() => {
    if (!viewerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setSelected((index) => wrap(index, -1, total));
      }
      if (event.key === 'ArrowRight') {
        setSelected((index) => wrap(index, 1, total));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [viewerOpen, total]);

  return (
    <Section header={header}>
      <div className="contrib">
        <Reveal className="contrib__story">
          <p className="contrib__label">{content.storyLabel}</p>
          <div className="contrib__story-text">
            {content.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        <div className="contrib__gallery">
          <Reveal className="contrib__gallery-head">
            <div>
              <p className="contrib__label">{content.galleryLabel}</p>
              <h3 className="contrib__title">{content.galleryTitle}</h3>
            </div>
            <p className="contrib__hint">{content.galleryHint}</p>
          </Reveal>

          <Reveal className="contrib__grid" delay={0.1}>
            <ul className="contrib-grid">
              {initiatives.map((item, index) => (
                <li key={item.slug} className="contrib-card">
                  <button
                    type="button"
                    className="contrib-card__button"
                    aria-haspopup="dialog"
                    onClick={() => open(index)}
                    onKeyDown={openOnKey(() => open(index))}
                  >
                    <Image
                      className="contrib-card__image"
                      src={item.thumb.src}
                      width={item.thumb.width}
                      height={item.thumb.height}
                      alt={item.alt}
                      unoptimized
                    />
                    <span className="contrib-card__caption">
                      <span className="contrib-card__number">
                        {pad(index + 1)}
                      </span>
                      {item.label}
                    </span>
                    <span className="contrib-card__zoom" aria-hidden="true">
                      <FontAwesomeIcon icon={faExpand} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="contrib__closing">
          <div className="contrib-stats">
            {content.stats.map((stat) => (
              <div key={stat.label} className="contrib-stat">
                <strong>
                  {stat.value}
                  {stat.suffix && <sup>{stat.suffix}</sup>}
                </strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="contrib__closing-text">
            <p>{content.closing}</p>
            <p className="contrib__highlight">{markup(content.highlight)}</p>
          </div>
        </Reveal>
      </div>

      {/* The photo opens large, with what the initiative was about. */}
      <ModalComponent
        visible={viewerOpen}
        setVisible={setViewerOpen}
        size="4xl"
        title={photo.title}
      >
        <div className="photo-viewer">
          <Image
            className="photo-viewer__image"
            src={photo.image.src}
            width={photo.image.width}
            height={photo.image.height}
            alt={photo.alt}
            unoptimized
          />
          <div className="photo-viewer__text">
            <p className="photo-viewer__count">
              <span>{pad(selected + 1)}</span> / {pad(total)}
            </p>
            <p className="photo-viewer__desc">{photo.description}</p>
            <div className="photo-viewer__nav">
              <button
                type="button"
                className="photo-viewer__arrow"
                aria-label={t.previous}
                onClick={() => go(-1)}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <button
                type="button"
                className="photo-viewer__arrow"
                aria-label={t.next}
                onClick={() => go(1)}
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          </div>
        </div>
      </ModalComponent>
    </Section>
  );
}
