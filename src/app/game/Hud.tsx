'use client';

// HOOKS
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRightArrowLeft,
  faBolt,
  faLocationDot,
  faCamera,
  faCheck,
  faDownload,
  faVolumeHigh,
  faVolumeXmark,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import { sectionIds, type SectionId } from '@/src/content/sections';
// GAME
import Compass from './Compass';
import { input } from './controls';
import GalaxyMap from './GalaxyMap';
import { overlay } from './overlay';
import Radar from './Radar';
import type { Ship } from './ships';
import { snapshot } from './Snapshot';
import { play } from './sound';
import type { Place, Toast } from './types';
import { HolocronIcon, Keycap, Pips } from './ui';
import { useMediaQuery } from './useMediaQuery';
import { biomes } from './world/biomes';

const stickRadius = 44;

const register = (element: HTMLDivElement | null) => {
  overlay.hud = element;
};
const registerLanding = (element: HTMLDivElement | null) => {
  overlay.landing = element;
};
const registerSpeedBar = (element: HTMLSpanElement | null) => {
  overlay.speedBar = element;
};

// A joystick under the right thumb and the boost under the left one. Both
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
    base.current?.removeAttribute('data-active');
    input.stick.turn = 0;
    input.stick.thrust = 0;
  };

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== null) return;
    pointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.active = '';
    move(event.clientX, event.clientY);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId === pointer.current) move(event.clientX, event.clientY);
  };
  const onUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerId === pointer.current) release();
  };

  const boost = (on: boolean) => (event: PointerEvent<HTMLButtonElement>) => {
    input.stick.boost = on;
    if (on) event.currentTarget.dataset.active = '';
    else event.currentTarget.removeAttribute('data-active');
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
        <span aria-hidden="true">{t.boost}</span>
      </button>
    </div>
  );
}

// The keys, as keycaps, under the flight.
function Legend() {
  const t = useI18n().messages.game;
  return (
    <p className="hud__hint">
      <span className="hud__hint-item">
        <span className="hud__keys">
          <Keycap>W</Keycap>
          <Keycap>A</Keycap>
          <Keycap>S</Keycap>
          <Keycap>D</Keycap>
        </span>
        {t.keysFly}
      </span>
      <span className="hud__hint-item">
        <Keycap>Shift</Keycap>
        {t.keysBoost}
      </span>
      <span className="hud__hint-item">
        <Keycap>M</Keycap>
        {t.keysMap}
      </span>
      <span className="hud__hint-item">
        <Keycap>H</Keycap>
        {t.keysArchive}
      </span>
      <span className="hud__hint-item">
        <Keycap>P</Keycap>
        {t.keysPhoto}
      </span>
    </p>
  );
}

// The pad under the ship: the place and its planet, and a ring that fills
// while the ship holds still on it, until it lands. The frame loop sets
// the phase and the ring (instruments.ts).
function Landing({ pad, place }: { pad: SectionId | null; place?: Place }) {
  const t = useI18n().messages.game;
  return (
    <div
      ref={registerLanding}
      className="hud__pad"
      role="status"
      data-phase="none"
      style={
        pad ? ({ '--pad': biomes[pad].accent } as CSSProperties) : undefined
      }
    >
      {pad && place && (
        <>
          <svg className="hud__pad-ring" viewBox="0 0 40 40" aria-hidden="true">
            <circle className="hud__pad-track" cx="20" cy="20" r="16" />
            <circle
              className="hud__pad-fill"
              cx="20"
              cy="20"
              r="16"
              pathLength="1"
            />
            <path className="hud__pad-check" d="M13.5 20.5l4.2 4.2 8.8-9.4" />
          </svg>
          <span className="hud__pad-text">
            <span className="g-label">
              <span className="hud__pad-zone">{t.landingZone} · </span>
              {biomes[pad].planet}
            </span>
            <strong>{place.title}</strong>
            <span className="hud__pad-hint">
              <span data-when="approach">{t.slowDown}</span>
              <span data-when="hold">{t.landing}</span>
              <span data-when="landed">{t.landed}</span>
            </span>
          </span>
        </>
      )}
    </div>
  );
}

// A planet's title, the first time the ship enters it, like a film's title
// card: the planet's name in wide letters, the section above it and a rule
// in its color that opens out. The name comes first for screen readers.
function PlanetTitle({
  id,
  place,
}: Readonly<{ id: SectionId; place?: Place }>) {
  const index = String(sectionIds.indexOf(id) + 1).padStart(2, '0');
  return (
    <div
      className="planet-title"
      style={{ '--accent': biomes[id].accent } as CSSProperties}
    >
      <p className="planet-title__name">{biomes[id].planet}</p>
      <p className="g-label planet-title__section">
        <span className="g-num">{index}</span>
        {place && ` · ${place.title}`}
      </p>
      <span className="planet-title__rule" aria-hidden="true" />
    </div>
  );
}

// The moment all seven holocrons are recovered: the frame goes wide, like
// a film's, and the archive's title comes up, with the sparks the ship
// throws (Ship.tsx) and the fanfare, if the sound is on; every record is
// then in the archive.
function Finale({ total }: { total: number }) {
  const t = useI18n().messages.game;
  return (
    <div className="finale" aria-hidden="true">
      <span className="finale__bar finale__bar--top" />
      <span className="finale__bar finale__bar--bottom" />
      <div className="finale__card">
        <HolocronIcon className="finale__icon" />
        <p className="g-label finale__label">{t.archiveComplete}</p>
        <p className="finale__title">{t.allFoundTitle}</p>
        <p className="finale__line">{t.allFoundLine}</p>
        <Pips
          count={total}
          total={total}
          kind="diamond"
          className="finale__pips"
        />
        <p className="finale__archive">
          {t.finaleArchive}
          <Keycap>H</Keycap>
        </p>
      </div>
    </div>
  );
}

// Photo mode: nothing over the picture but a viewfinder's corners and two
// buttons. A saved photo flashes the screen and says so for a moment.
function PhotoMode({ onLeave }: { onLeave: () => void }) {
  const t = useI18n().messages.game;
  const [shots, setShots] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const save = () => {
    const picture = snapshot.take?.();
    if (!picture) return;
    const sector = overlay.hud?.dataset.sector;
    const planet =
      sector && sector !== 'hub'
        ? biomes[sector as SectionId].planet.toLowerCase()
        : 'space';
    const name = `portfolio-${planet}.png`;
    const link = document.createElement('a');
    link.href = picture;
    link.download = name;
    link.click();
    play('photo');
    setShots((count) => count + 1);
    setSaved(name);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaved(null), 2600);
  };

  return (
    <div className="photo" role="group" aria-label={t.photoMode}>
      <span className="photo__frame" aria-hidden="true" />
      <div className="photo__bar">
        <span className="g-label photo__label">
          <FontAwesomeIcon icon={faCamera} />
          {t.photoMode}
        </span>
        <button type="button" className="g-btn g-btn--primary" onClick={save}>
          <FontAwesomeIcon icon={faDownload} />
          {t.savePhoto}
        </button>
        <button type="button" className="g-btn" onClick={onLeave}>
          <FontAwesomeIcon icon={faXmark} />
          {t.leavePhoto}
          <Keycap>Esc</Keycap>
        </button>
      </div>
      {saved && (
        <p className="photo__saved" role="status">
          <FontAwesomeIcon icon={faCheck} />
          {t.photoSaved}
          <span className="g-num">{saved}</span>
        </p>
      )}
      {shots > 0 && (
        <span key={shots} className="photo__flash" aria-hidden="true" />
      )}
    </div>
  );
}

interface HudProps {
  ship: Ship;
  // The pad the ship is on.
  pad: SectionId | null;
  // The places of the arena, each on its planet.
  places: Place[];
  // The sections opened so far, and the holocrons found.
  visited: SectionId[];
  found: SectionId[];
  home: string;
  onChangeShip: () => void;
  // The navigation chart over the flight, and the course set on it.
  mapOpen: boolean;
  // While the chart fades out, after it was closed.
  mapLeaving: boolean;
  onOpenMap: () => void;
  onCloseMap: () => void;
  // A section read from the chart, without landing.
  onRead: (id: SectionId) => void;
  // The holocron archive, and how many of its records are new.
  archiveOpen: boolean;
  unread: number;
  onOpenArchive: () => void;
  course: SectionId | null;
  onCourse: (id: SectionId) => void;
  // The sounds, and the photo mode, which hides everything but the picture.
  soundOn: boolean;
  onToggleSound: () => void;
  photo: boolean;
  onPhoto: (on: boolean) => void;
  // The notices of the moment, the title of a planet the first time the
  // ship enters it, and the finale of the holocrons.
  toasts: Toast[];
  title: { id: SectionId; key: number } | null;
  finale: boolean;
}

// The flight's instruments, as one system over the canvas: the way back
// and the mission's log on the left, the compass along the top, the radar
// and where the ship is on the right, the ship and its speed at the bottom
// left, and the keys or the touch controls at the bottom. The frame loop
// writes what moves (instruments.ts); React draws what changes now and
// then.
export default function Hud({
  ship,
  pad,
  places,
  visited,
  found,
  home,
  onChangeShip,
  mapOpen,
  mapLeaving,
  onOpenMap,
  onCloseMap,
  onRead,
  archiveOpen,
  unread,
  onOpenArchive,
  course,
  onCourse,
  soundOn,
  onToggleSound,
  photo,
  onPhoto,
  toasts,
  title,
  finale,
}: Readonly<HudProps>) {
  const t = useI18n().messages.game;
  const touch = useMediaQuery('(pointer: coarse)');
  const total = places.length;
  const placeOf = (id: SectionId) => places.find((place) => place.id === id);

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
      data-finale={finale ? '' : undefined}
    >
      <div className="hud__top">
        <div className="hud__nw">
          <a className="g-btn hud__back" href={home} aria-label={t.backToSite}>
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="hud__back-label">{t.backToSite}</span>
          </a>
          <div className="hud__log">
            <p className="g-label hud__mission">{t.mission}</p>
            <p className="hud__count tally">
              <span className="tally__label">{t.sections}</span>
              <FontAwesomeIcon icon={faLocationDot} className="tally__icon" />
              <Pips count={visited.length} total={total} />
              <span className="tally__value g-num" aria-hidden="true">
                {visited.length}/{total}
              </span>
              <span className="g-sr">
                {format(t.visited, {
                  count: String(visited.length),
                  total: String(total),
                })}
              </span>
            </p>
            <p className="hud__holocrons tally">
              <span className="tally__label">{t.holocronsLabel}</span>
              <HolocronIcon className="tally__icon" />
              <Pips count={found.length} total={total} kind="diamond" />
              <span className="tally__value g-num" aria-hidden="true">
                {found.length}/{total}
              </span>
              <span className="g-sr">
                {format(t.holocrons, {
                  count: String(found.length),
                  total: String(total),
                })}
              </span>
            </p>
            {visited.length >= total && (
              <p className="hud__done" role="status">
                <FontAwesomeIcon icon={faCheck} />
                <span aria-hidden="true">{t.explored}</span>
                <span className="g-sr">{t.allVisited}</span>
              </p>
            )}
            {found.length >= total && (
              <p className="hud__found" role="status">
                <HolocronIcon />
                <span aria-hidden="true">{t.archiveComplete}</span>
                <span className="g-sr">{t.allFound}</span>
              </p>
            )}
          </div>
          <div className="hud__tools">
            <button
              type="button"
              className="g-btn g-btn--icon hud__tool hud__archive"
              aria-haspopup="dialog"
              aria-expanded={archiveOpen}
              aria-label={
                unread
                  ? format(t.openArchiveNew, { count: String(unread) })
                  : t.openArchive
              }
              data-tip={t.archive}
              data-key="H"
              onClick={onOpenArchive}
            >
              <HolocronIcon />
              {unread > 0 && (
                <span className="hud__badge g-num" aria-hidden="true">
                  {unread}
                </span>
              )}
            </button>
            <button
              type="button"
              className="g-btn g-btn--icon hud__tool"
              aria-pressed={soundOn}
              aria-label={soundOn ? t.soundOn : t.soundOff}
              data-tip={soundOn ? t.soundOn : t.soundOff}
              onClick={onToggleSound}
            >
              <FontAwesomeIcon icon={soundOn ? faVolumeHigh : faVolumeXmark} />
              <span className="hud__eq" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </button>
            <button
              type="button"
              className="g-btn g-btn--icon hud__tool"
              aria-pressed={photo}
              aria-label={t.photoMode}
              data-tip={t.photoMode}
              data-key="P"
              onClick={() => onPhoto(!photo)}
            >
              <FontAwesomeIcon icon={faCamera} />
            </button>
          </div>
        </div>
        <Compass />
        <div className="hud__ne">
          <button
            type="button"
            className="radar-button"
            aria-label={t.openMap}
            onClick={onOpenMap}
          >
            <Radar
              activePad={pad}
              visited={visited}
              found={found}
              course={course}
            />
            <Keycap>M</Keycap>
          </button>
          <div className="hud__locator">
            <p className="hud__planet" data-id="hub">
              <strong>{t.centralDeck}</strong>
            </p>
            {places.map((place) => (
              <p
                key={place.id}
                className="hud__planet"
                data-id={place.id}
                hidden
                style={{ '--accent': biomes[place.id].accent } as CSSProperties}
              >
                <strong>{biomes[place.id].planet}</strong>
                <small>{place.title}</small>
              </p>
            ))}
            <p className="hud__coords g-num" aria-hidden="true">
              <span>X</span>
              <b data-read="x">+000.0</b>
              <span>Z</span>
              <b data-read="z">+000.0</b>
            </p>
          </div>
        </div>
      </div>

      <Landing pad={pad} place={pad ? placeOf(pad) : undefined} />

      <div className="planet-titles" role="status">
        {title && !finale && (
          <PlanetTitle
            key={title.key}
            id={title.id}
            place={placeOf(title.id)}
          />
        )}
      </div>

      <div className="toasts" role="status">
        {toasts.map((toast) => (
          <div
            key={toast.key}
            className="toast"
            data-kind={toast.kind}
            style={
              toast.kind === 'briefing'
                ? undefined
                : ({ '--accent': biomes[toast.id].accent } as CSSProperties)
            }
          >
            {toast.kind === 'briefing' ? (
              <>
                <HolocronIcon className="toast__icon" />
                <p className="toast__title">{t.mission}</p>
                <p className="toast__meta">{t.briefingText}</p>
                <p className="toast__record">
                  <HolocronIcon />
                  {t.archive}
                  <Keycap>H</Keycap>
                </p>
              </>
            ) : toast.kind === 'holocron' ? (
              <>
                <HolocronIcon className="toast__icon" />
                <p className="toast__title">{t.holocronFound}</p>
                <p className="toast__meta">
                  {format(t.holocronOn, { planet: biomes[toast.id].planet })}
                  {' · '}
                  {placeOf(toast.id)?.title}
                </p>
                <p className="toast__count g-num">
                  {toast.count}/{total}
                </p>
                <Pips
                  count={toast.count}
                  total={total}
                  kind="diamond"
                  fresh={toast.count - 1}
                  className="toast__pips"
                />
                {toast.record && (
                  <p className="toast__record">
                    {format(t.newRecord, { title: toast.record })}
                    <Keycap>H</Keycap>
                  </p>
                )}
              </>
            ) : (
              <>
                <span className="toast__icon toast__icon--check">
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                <p className="toast__title">{t.explored}</p>
                <p className="toast__meta">{t.allVisited}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {finale && <Finale total={total} />}

      <div className="hud__bottom">
        <div className="hud__craft">
          <p className="hud__craft-id">
            <strong className="hud__ship">{ship.name}</strong>
            <span className="g-label">{ship.model}</span>
          </p>
          <div className="speedo" aria-hidden="true">
            <span className="g-label">{t.speedLabel}</span>
            <span className="speedo__value">
              <b className="g-num" data-read="speed">
                0.0
              </b>
              <small>m/s</small>
            </span>
            <span className="speedo__bar">
              <span ref={registerSpeedBar} />
            </span>
            <span className="speedo__boost">{t.boost}</span>
          </div>
          <button
            type="button"
            className="g-btn hud__swap"
            aria-label={t.changeShip}
            onClick={onChangeShip}
          >
            <FontAwesomeIcon icon={faArrowRightArrowLeft} />
            <span className="hud__swap-label">{t.changeShip}</span>
          </button>
        </div>
        {touch ? <TouchControls /> : <Legend />}
      </div>

      {photo && <PhotoMode onLeave={() => onPhoto(false)} />}
      {mapOpen && (
        <GalaxyMap
          leaving={mapLeaving}
          ship={ship}
          activePad={pad}
          visited={visited}
          found={found}
          places={places}
          course={course}
          onCourse={onCourse}
          onRead={onRead}
          onClose={onCloseMap}
        />
      )}
    </div>
  );
}
