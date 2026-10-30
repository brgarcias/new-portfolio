'use client';

// HOOKS
import { useEffect, useRef, type CSSProperties } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faLocationArrow,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
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
// ship moving on it, and the sections as cards, with the ones already
// opened and the one the ship is at. It opens from the radar or with M,
// and closes with its button, with Escape, with M again or with a click
// outside.
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
    if (id === activePad) return 'active';
    return visited.includes(id) ? 'visited' : undefined;
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
          <div>
            <h2 id="game-map-title" className="game-map__title">
              {t.map}
            </h2>
            <p className="game-map__count">
              {format(t.visited, {
                count: String(visited.length),
                total: String(places.length),
              })}
            </p>
          </div>
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
          <div className="game-map__chart">
            <Radar
              scope="map"
              large
              activePad={activePad}
              visited={visited}
              registerShip={registerShip}
            />
          </div>
          <ol className="game-map__legend">
            {places.map((place, index) => {
              const state = stateOf(place.id);
              return (
                <li
                  key={place.id}
                  data-state={state}
                  style={
                    {
                      '--accent': biomes[place.id].accent,
                      '--i': index,
                    } as CSSProperties
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
                  <span className="game-map__state">
                    {state === 'active' && (
                      <FontAwesomeIcon icon={faLocationArrow} />
                    )}
                    {state === 'visited' && <FontAwesomeIcon icon={faCheck} />}
                    {state === 'active'
                      ? t.youAreHere
                      : state === 'visited'
                        ? t.sectionOpened
                        : t.notOpened}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
