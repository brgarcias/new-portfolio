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
import ModalComponent, { openOnKey } from '@/src/components/Modal';
// CONTENT
import { items } from './contributing';
// CSS
import './styles.css';

const total = items.length;
const pad = (value: number) => String(value).padStart(2, '0');
// The viewer goes around: after the last photo comes the first.
const move = (index: number, step: number) => (index + step + total) % total;

export default function Contributing() {
  const [selected, setSelected] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const photo = items[selected];

  const open = (index: number) => {
    setSelected(index);
    setViewerOpen(true);
  };

  const go = (step: number) => setSelected((index) => move(index, step));

  // The arrow keys browse the photos while the viewer is open.
  useEffect(() => {
    if (!viewerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setSelected((index) => move(index, -1));
      if (event.key === 'ArrowRight') setSelected((index) => move(index, 1));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [viewerOpen]);

  return (
    <Section
      id="contributing"
      description={
        <>
          Developing the community side{' '}
          <span className="text-gradient">the most important</span>!
        </>
      }
      quote={{
        text: 'Our lives begin to end the day we remain silent about the things that matter.',
        author: 'Martin Luther King Jr.',
      }}
    >
      <div className="contrib">
        <Reveal className="contrib__story">
          <p className="contrib__label">Why this matters</p>
          <div className="contrib__story-text">
            <p>
              Alongside my work as a software engineer, I actively participate
              in volunteer initiatives supporting children, families in
              vulnerable situations, and elderly communities. These experiences
              reinforce my belief that technology professionals should generate
              impact not only through systems — but through people.
            </p>
            <p>
              Contributing to social initiatives keeps me connected with
              real-world challenges and strengthens values that also shape how I
              collaborate professionally: empathy, responsibility, and long-term
              thinking.
            </p>
          </div>
        </Reveal>

        <div className="contrib__gallery">
          <Reveal className="contrib__gallery-head">
            <div>
              <p className="contrib__label">Initiatives &amp; Gallery</p>
              <h3 className="contrib__title">Initiatives I participated in</h3>
            </div>
            <p className="contrib__hint">Open each photo to learn more</p>
          </Reveal>

          <Reveal className="contrib__grid" delay={0.1}>
            <ul className="contrib-grid">
              {items.map((item, index) => (
                <li key={item.number} className="contrib-card">
                  <button
                    type="button"
                    className="contrib-card__button"
                    aria-haspopup="dialog"
                    onClick={() => open(index)}
                    onKeyDown={openOnKey(() => open(index))}
                  >
                    <Image
                      className="contrib-card__image"
                      src={item.src}
                      alt={item.alt}
                      unoptimized
                    />
                    <span className="contrib-card__caption">
                      <span className="contrib-card__number">
                        {item.number}
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
            <div className="contrib-stat">
              <strong>
                4<sup>+</sup>
              </strong>
              <span>initiatives</span>
            </div>
            <div className="contrib-stat">
              <strong>
                100<sup>+</sup>
              </strong>
              <span>volunteer hours</span>
            </div>
            <div className="contrib-stat">
              <strong>∞</strong>
              <span>communities</span>
            </div>
          </div>
          <div className="contrib__closing-text">
            <p>
              Staying involved with community initiatives helps me maintain
              perspective about the purpose behind everything we build as
              engineers.
            </p>
            <p className="contrib__highlight">
              Technology transforms systems — <em>people transform lives.</em>
            </p>
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
            src={photo.src}
            alt={photo.alt}
            unoptimized
          />
          <div className="photo-viewer__text">
            <p className="photo-viewer__count">
              <span>{photo.number}</span> / {pad(total)}
            </p>
            <p className="photo-viewer__desc">{photo.desc}</p>
            <div className="photo-viewer__nav">
              <button
                type="button"
                className="photo-viewer__arrow"
                aria-label="Previous photo"
                onClick={() => go(-1)}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <button
                type="button"
                className="photo-viewer__arrow"
                aria-label="Next photo"
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
