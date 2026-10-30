'use client';

// HOOKS
import { useRef, type PointerEvent } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faBolt,
  faCamera,
  faCube,
  faDownload,
  faVolumeHigh,
  faVolumeXmark,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { input } from './controls';
import GalaxyMap from './GalaxyMap';
import { overlay } from './overlay';
import Radar from './Radar';
import type { Ship } from './ships';
import { snapshot } from './Snapshot';
import { play } from './sound';
import type { Place } from './types';
import { biomes } from './world/biomes';
import { useMediaQuery } from './useMediaQuery';

const stickRadius = 44;

// A joystick under the left thumb and the boost under the right one. Both
// write straight into the controls, with no render in between.
function TouchControls() {
  const t = useI18n().messages.game;
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);

  const move = (clientX: number, clientY: number) => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect || !knob.current) return;
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > stickRadius) {
      dx *= stickRadius / distance;
      dy *= stickRadius / distance;
    }
    knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    input.stick.turn = dx / stickRadius;
    input.stick.thrust = -dy / stickRadius;
  };

  const release = () => {
    pointer.current = null;
    if (knob.current) knob.current.style.transform = '';
    input.stick.turn = 0;
    input.stick.thrust = 0;
  };

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== null) return;
    pointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    move(event.clientX, event.clientY);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId === pointer.current) move(event.clientX, event.clientY);
  };
  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId === pointer.current) release();
  };

  const boost = (on: boolean) => () => {
    input.stick.boost = on;
  };

  return (
    <div className="touch">
      <div
        ref={base}
        className="joystick"
        role="slider"
        aria-label={t.joystick}
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onLostPointerCapture={onUp}
        onContextMenu={(event) => event.preventDefault()}
      >
        <div ref={knob} className="joystick__knob" />
      </div>
      <button
        type="button"
        className="boost"
        aria-label={t.boost}
        onPointerDown={boost(true)}
        onPointerUp={boost(false)}
        onPointerCancel={boost(false)}
        onPointerLeave={boost(false)}
        onContextMenu={(event) => event.preventDefault()}
      >
        <FontAwesomeIcon icon={faBolt} />
      </button>
    </div>
  );
}

interface HudProps {
  ship: Ship;
  // The pad the ship is on, and its name.
  pad: SectionId | null;
  padTitle: string | null;
  // The places of the arena, each on its planet.
  places: Place[];
  // The sections opened so far, of how many, and the holocrons found.
  visited: SectionId[];
  found: SectionId[];
  total: number;
  home: string;
  onChangeShip: () => void;
  // The map over the flight, and how it opens and closes.
  mapOpen: boolean;
  onOpenMap: () => void;
  onCloseMap: () => void;
  // The sounds, and the photo mode, which hides everything but the picture.
  soundOn: boolean;
  onToggleSound: () => void;
  photo: boolean;
  onPhoto: (on: boolean) => void;
}

const register = (element: HTMLDivElement | null) => {
  overlay.hud = element;
};
const registerRadarShip = (element: SVGGElement | null) => {
  overlay.radarShip = element;
};

// What lies over the flight: the way back, the ship's name, the count of
// sections seen, the radar, the pad under the ship and the controls.
// Fingers get the joystick; a mouse, the keyboard's hint.
export default function Hud({
  ship,
  pad,
  padTitle,
  places,
  visited,
  found,
  total,
  home,
  onChangeShip,
  mapOpen,
  onOpenMap,
  onCloseMap,
  soundOn,
  onToggleSound,
  photo,
  onPhoto,
}: Readonly<HudProps>) {
  const t = useI18n().messages.game;
  const touch = useMediaQuery('(pointer: coarse)');
  const done = visited.length >= total;
  const complete = found.length >= places.length;

  // Saves the picture, named after the planet under the ship.
  const savePhoto = () => {
    const picture = snapshot.take?.();
    if (!picture) return;
    const sector = overlay.hud?.dataset.sector;
    const planet =
      sector && sector !== 'hub'
        ? biomes[sector as SectionId].planet.toLowerCase()
        : 'space';
    const link = document.createElement('a');
    link.href = picture;
    link.download = `portfolio-${planet}.png`;
    link.click();
    play('photo');
  };

  return (
    <div
      ref={register}
      className="hud"
      data-x="0"
      data-z="0"
      data-heading="0"
      data-speed="0"
      data-sector="hub"
      data-photo={photo ? '' : undefined}
    >
      <div className="hud__top">
        <a className="btn btn--ghost btn--small" href={home}>
          <FontAwesomeIcon icon={faArrowLeft} />
          {t.backToSite}
        </a>
        <p className="hud__ship">{ship.name}</p>
        <p className="hud__count">
          {format(t.visited, {
            count: String(visited.length),
            total: String(total),
          })}
        </p>
        <p className="hud__holocrons">
          <FontAwesomeIcon icon={faCube} />
          {format(t.holocrons, {
            count: String(found.length),
            total: String(places.length),
          })}
        </p>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={onChangeShip}
        >
          {t.changeShip}
        </button>
      </div>
      <div className="hud__tools">
        <button
          type="button"
          className="hud__tool"
          aria-pressed={soundOn}
          aria-label={soundOn ? t.soundOn : t.soundOff}
          onClick={onToggleSound}
        >
          <FontAwesomeIcon icon={soundOn ? faVolumeHigh : faVolumeXmark} />
        </button>
        <button
          type="button"
          className="hud__tool"
          aria-pressed={photo}
          aria-label={t.photoMode}
          onClick={() => onPhoto(!photo)}
        >
          <FontAwesomeIcon icon={faCamera} />
        </button>
      </div>
      <button
        type="button"
        className="radar-button"
        aria-label={t.openMap}
        onClick={onOpenMap}
      >
        <Radar
          scope="hud"
          activePad={pad}
          visited={visited}
          found={found}
          registerShip={registerRadarShip}
        />
      </button>
      {/* The planet under the ship: the frame loop shows the one it is over. */}
      {places.map((place) => (
        <p key={place.id} className="hud__planet" data-id={place.id} hidden>
          <strong>{biomes[place.id].planet}</strong>
          <small>{place.title}</small>
        </p>
      ))}
      <p className="hud__pad" role="status">
        {padTitle && (
          <>
            {format(t.landingPad, { place: padTitle })}
            <span className="hud__pad-hint">· {t.stopToLand}</span>
          </>
        )}
      </p>
      {done && (
        <p className="hud__done" role="status">
          {t.allVisited}
        </p>
      )}
      {complete && (
        <p className="hud__found" role="status">
          {t.allFound}
        </p>
      )}
      {touch ? <TouchControls /> : <p className="hud__hint">{t.keyboard}</p>}
      {photo && (
        <div className="hud__photo" role="group" aria-label={t.photoMode}>
          <button
            type="button"
            className="btn btn--primary btn--small"
            onClick={savePhoto}
          >
            <FontAwesomeIcon icon={faDownload} />
            {t.savePhoto}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => onPhoto(false)}
          >
            <FontAwesomeIcon icon={faXmark} />
            {t.leavePhoto}
          </button>
        </div>
      )}
      {mapOpen && (
        <GalaxyMap
          activePad={pad}
          visited={visited}
          found={found}
          places={places}
          onClose={onCloseMap}
        />
      )}
    </div>
  );
}
