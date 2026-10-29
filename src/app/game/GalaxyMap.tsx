'use client';

// HOOKS
import { useEffect, useRef } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { overlay } from './overlay';
import Radar from './Radar';
import type { Place } from './types';
import { biomes } from './world/biomes';

interface GalaxyMapProps {
  activePad: SectionId | null;
  visited: SectionId[];
  places: Place[];
  onClose: () => void;
}

const registerShip = (element: SVGGElement | null) => {
  overlay.mapShip = element;
};

// The map of the world over the flight: the planets with their names, the
// ship moving on it, and the list of the sections, with the ones already
// opened. It opens from the radar or with M, and closes with its button,
// with Escape, with M again or with a click outside.
export default function GalaxyMap({
  activePad,
  visited,
  places,
  onClose,
}: Readonly<GalaxyMapProps>) {
  const t = useI18n().messages.game;
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    close.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const stateOf = (id: SectionId) => {
    if (id === activePad) return t.youAreHere;
    return visited.includes(id) ? t.sectionOpened : t.notOpened;
  };

  return (
    <div className="game-map">
      <button
        type="button"
        className="game-map__backdrop"
        aria-label={t.closeMap}
        tabIndex={-1}
        onClick={onClose}
      />
      <section
        className="game-map__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-map-title"
      >
        <header className="game-map__bar">
          <h2 id="game-map-title" className="game-map__title">
            {t.map}
          </h2>
          <button
            ref={close}
            type="button"
            className="game-panel__close"
            aria-label={t.closeMap}
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <div className="game-map__body">
          <Radar
            scope="map"
            large
            activePad={activePad}
            visited={visited}
            registerShip={registerShip}
          />
          <ol className="game-map__legend">
            {places.map((place) => (
              <li
                key={place.id}
                data-state={
                  place.id === activePad
                    ? 'active'
                    : visited.includes(place.id)
                      ? 'visited'
                      : undefined
                }
              >
                <span
                  className="game-map__dot"
                  style={{ background: biomes[place.id].accent }}
                />
                <span className="game-map__planet">
                  <strong>{biomes[place.id].planet}</strong>
                  <small>{place.title}</small>
                </span>
                <em>{stateOf(place.id)}</em>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
