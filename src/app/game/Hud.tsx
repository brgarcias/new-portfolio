'use client';

// HOOKS
import { useRef, type PointerEvent } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBolt } from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { input } from './controls';
import { overlay } from './overlay';
import Radar from './Radar';
import type { Ship } from './ships';
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
  // The sections opened so far, of how many.
  visited: SectionId[];
  total: number;
  home: string;
  onChangeShip: () => void;
}

const register = (element: HTMLDivElement | null) => {
  overlay.hud = element;
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
  total,
  home,
  onChangeShip,
}: Readonly<HudProps>) {
  const t = useI18n().messages.game;
  const touch = useMediaQuery('(pointer: coarse)');
  const done = visited.length >= total;

  return (
    <div
      ref={register}
      className="hud"
      data-x="0"
      data-z="0"
      data-heading="0"
      data-speed="0"
      data-sector="hub"
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
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={onChangeShip}
        >
          {t.changeShip}
        </button>
      </div>
      <Radar activePad={pad} visited={visited} />
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
      {touch ? <TouchControls /> : <p className="hud__hint">{t.keyboard}</p>}
    </div>
  );
}
