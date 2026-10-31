'use client';

// HOOKS
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
// THREE
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowsRotate,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// GAME
import { shipIds, ships, specOf, specs, type Ship, type ShipId } from './ships';
import { Keycap, ShipGlyph } from './ui';
import { useReducedMotion } from './useMediaQuery';

interface HangarProps {
  shipId: ShipId;
  onChoose: (id: ShipId) => void;
  // The moment the launch begins, inside the pilot's press, so the sound
  // can start; and the moment the ship has gone, when the flight takes
  // over.
  onIgnite: () => void;
  onTakeOff: () => void;
  // The address of the site in the page's language.
  home: string;
}

// The camera on the hangar's stage, and the way that points away from it,
// down the camera's line of sight, along which the ship leaves on launch.
const cameraAt: [number, number, number] = [6.5, 3.2, -8.5];
const awayYaw = Math.atan2(cameraAt[0], cameraAt[2]);
// How long the launch lasts, in milliseconds, until the flight takes over.
const launchTime = 950;

// How the ship on the pedestal is turned: by itself, slowly, or by a
// finger or the mouse dragged across the stage, which spins it and lets
// it coast to a stop, as a wheel would. The frame loop reads it; the
// stage reports the turn as data attributes, and as a readout.
const spin = {
  yaw: 0,
  pitch: 0,
  velocity: 0,
  // Of the pitch, when the drag goes up or down.
  tilt: 0,
  // Seconds since the ship on the pedestal changed: it grows in.
  appear: 10,
  dragging: false,
  // Seconds since the last drag.
  idle: 10,
  last: { x: 0, y: 0, at: 0 },
  stage: null as HTMLDivElement | null,
  readout: null as HTMLSpanElement | null,
  clock: 1,
  // Seconds since the launch began, or less than zero before it.
  launch: -1,
  // The materials of the ship's engines, which flare on launch.
  engines: [] as THREE.MeshStandardMaterial[],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const angle = (radians: number) => {
  const degrees = Math.round((radians * 180) / Math.PI);
  return (((degrees % 360) + 360) % 360).toString().padStart(3, '0');
};

// The pedestal's ring of segments, turning slowly under the ship.
const segments = Array.from({ length: 24 }, (_, index) => index);

// The launch, a frame of it: the ship turns away from the camera, lifts off
// the pedestal, its engines flare, and it shoots off down the line of
// sight, faster and faster.
function flyOff(stand: THREE.Group, dt: number) {
  spin.launch += dt;
  const time = spin.launch;
  const turn = Math.PI * 2;
  const target = awayYaw + turn * Math.round((spin.yaw - awayYaw) / turn);
  spin.yaw += (target - spin.yaw) * (1 - Math.exp(-9 * dt));
  spin.pitch += (-0.14 - spin.pitch) * (1 - Math.exp(-7 * dt));
  const go = Math.max(0, time - 0.2);
  const distance = 60 * go * go;
  stand.position.set(
    -Math.sin(spin.yaw) * distance,
    Math.min(1, time / 0.2) * 0.35 + go * 1.5,
    -Math.cos(spin.yaw) * distance,
  );
  const flare = 1 + Math.min(1, time / 0.25) * 4;
  for (const engine of spin.engines) engine.emissiveIntensity = flare;
}

// The chosen ship, turning on its pedestal.
function Preview({ shipId }: { shipId: ShipId }) {
  const model = useMemo(() => ships[shipId].build(), [shipId]);
  const stand = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    spin.yaw = reduced ? 0.6 : 0;
    spin.pitch = 0;
    spin.velocity = 0;
    spin.tilt = 0;
    spin.idle = 10;
  }, [reduced]);

  // The engines' materials, each the ship's own, freed with it.
  useEffect(() => {
    const engines: THREE.MeshStandardMaterial[] = [];
    model.traverse((object) => {
      if (object.userData.engine && object instanceof THREE.Mesh) {
        engines.push(object.material as THREE.MeshStandardMaterial);
      }
    });
    spin.engines = engines;
    return () => {
      spin.engines = [];
      for (const material of engines) material.dispose();
    };
  }, [model]);

  // A new ship on the pedestal grows in, on a spring.
  useEffect(() => {
    spin.appear = reduced ? 10 : 0;
  }, [model, reduced]);

  useEffect(
    () => () =>
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      }),
    [model],
  );

  useFrame((_, delta) => {
    if (!stand.current) return;
    const dt = Math.min(delta, 0.1);
    if (!spin.dragging) {
      spin.yaw += spin.velocity * dt;
      spin.velocity *= Math.exp(-2.2 * dt);
      spin.pitch = clamp(spin.pitch + spin.tilt * dt, -1.2, 1.2);
      spin.tilt *= Math.exp(-2.2 * dt);
      spin.idle += dt;
      // Left alone for a moment, it goes back to its slow turn, and after
      // a while it levels out.
      if (!reduced && spin.idle > 2) {
        spin.yaw += dt * 0.45 * Math.min(1, spin.idle - 2);
      }
      if (spin.idle > 6) spin.pitch *= Math.exp(-0.8 * dt);
    }
    spin.appear += dt;
    const grow =
      1 - 0.35 * Math.exp(-5 * spin.appear) * Math.cos(9 * spin.appear);
    if (spin.launch >= 0) flyOff(stand.current, dt);
    stand.current.scale.setScalar(grow);
    stand.current.rotation.y = spin.yaw;
    stand.current.rotation.x = spin.pitch;
    if (ring.current && !reduced) ring.current.rotation.y -= dt * 0.18;
    if (spin.stage) {
      spin.stage.dataset.yaw = spin.yaw.toFixed(2);
      spin.stage.dataset.pitch = spin.pitch.toFixed(2);
    }
    spin.clock += dt;
    if (spin.readout && spin.clock > 0.12) {
      spin.clock = 0;
      const tilt = Math.round((spin.pitch * 180) / Math.PI);
      spin.readout.textContent = `${angle(spin.yaw)}° · ${tilt < 0 ? '−' : '+'}${String(Math.abs(tilt)).padStart(2, '0')}°`;
    }
  });

  return (
    <>
      <hemisphereLight args={['#8d8fff', '#15161f', 1]} />
      {/* The key light on the camera's side, the fill from behind. */}
      <directionalLight position={[6, 8, -6]} intensity={1.7} color="#fff2e0" />
      <directionalLight position={[-6, 3, 5]} intensity={0.6} color="#5c5edc" />
      <group ref={stand}>
        <primitive object={model} position={[0, 0.6, 0]} />
      </group>
      {/* The pedestal: a dark disc, a lit ring, a ring of segments that
          turns, and a soft glow where the ship's light falls. */}
      <mesh rotation-x={-Math.PI / 2} position-y={-1.62}>
        <circleGeometry args={[3.4, 64]} />
        <meshBasicMaterial color="#0d1022" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-1.6}>
        <ringGeometry args={[3.25, 3.42, 64]} />
        <meshBasicMaterial color="#7b7dff" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-1.61}>
        <circleGeometry args={[2.6, 48]} />
        <meshBasicMaterial
          color="#5c5edc"
          transparent
          opacity={0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <group ref={ring} position-y={-1.59}>
        {segments.map((index) => (
          <mesh
            key={index}
            rotation-x={-Math.PI / 2}
            rotation-z={(index / segments.length) * Math.PI * 2}
          >
            <ringGeometry
              args={[
                3.7,
                3.82,
                6,
                1,
                0,
                (Math.PI * 2) / segments.length - 0.08,
              ]}
            />
            <meshBasicMaterial
              color="#9ad7ff"
              transparent
              opacity={index % 6 === 0 ? 0.75 : 0.28}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

const registerStage = (element: HTMLDivElement | null) => {
  spin.stage = element;
};
const registerReadout = (element: HTMLSpanElement | null) => {
  spin.readout = element;
};

// The stage, where a drag turns the ship, framed like a projector's view:
// the model and class above, the bay's number, the drag's hint and the
// turn's readout below. A light crosses it whenever the ship changes.
function Stage({
  ship,
  index,
  launching,
}: {
  ship: Ship;
  index: number;
  launching: boolean;
}) {
  const t = useI18n().messages.game;
  const reduced = useReducedMotion();

  const onDown = (event: PointerEvent<HTMLDivElement>) => {
    if (spin.dragging) return;
    spin.dragging = true;
    spin.velocity = 0;
    spin.tilt = 0;
    spin.last = { x: event.clientX, y: event.clientY, at: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!spin.dragging) return;
    const now = performance.now();
    const dx = event.clientX - spin.last.x;
    const dy = event.clientY - spin.last.y;
    const seconds = Math.max(0.001, (now - spin.last.at) / 1000);
    spin.yaw += dx * 0.012;
    spin.pitch = clamp(spin.pitch + dy * 0.01, -1.2, 1.2);
    // The speed of the drag, smoothed, is what the ship keeps on release.
    spin.velocity = spin.velocity * 0.5 + ((dx * 0.012) / seconds) * 0.5;
    spin.tilt = spin.tilt * 0.5 + ((dy * 0.01) / seconds) * 0.5;
    spin.last = { x: event.clientX, y: event.clientY, at: now };
  };
  const onUp = () => {
    if (!spin.dragging) return;
    spin.dragging = false;
    spin.idle = 0;
    if (reduced) {
      spin.velocity = 0;
      spin.tilt = 0;
    }
  };

  return (
    <div
      ref={registerStage}
      className="hangar__stage"
      data-yaw="0.00"
      data-pitch="0.00"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <Canvas
        className="hangar__canvas"
        dpr={[1, 1.5]}
        camera={{
          fov: 38,
          near: 0.5,
          far: 100,
          position: cameraAt,
        }}
      >
        <Preview shipId={ship.id} />
      </Canvas>
      <div className="stage-hud">
        <p className="stage-hud__tl" aria-hidden="true">
          <b>{ship.model}</b>
          <span>{t.classes[ship.kind]}</span>
        </p>
        <p className="stage-hud__tr g-num" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
          <span>/{String(shipIds.length).padStart(2, '0')}</span>
        </p>
        <p className="stage-hud__bl">
          <FontAwesomeIcon icon={faArrowsRotate} />
          {t.dragToTurn}
        </p>
        <p className="stage-hud__br g-num" aria-hidden="true">
          <span ref={registerReadout}>000° · +00°</span>
        </p>
        <span
          key={launching ? 'launch' : ship.id}
          className="stage-hud__scan"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

const units: Record<string, string> = {
  speed: 'm/s',
  acceleration: 'm/s²',
  agility: '°/s',
  boost: '',
};

// The ship's sheet: its number, name, model, class and maker, what it is
// like to fly, and its figures, each on a meter that places it among the
// hangar's ships.
function Sheet({
  ship,
  index,
  launching,
  onTakeOff,
}: {
  ship: Ship;
  index: number;
  launching: boolean;
  onTakeOff: () => void;
}) {
  const t = useI18n().messages.game;
  return (
    <section className="hangar__spec" aria-labelledby="hangar-ship">
      <div key={ship.id} className="hangar__spec-body">
        <p className="hangar__index g-num">
          <span>{String(index + 1).padStart(2, '0')}</span>/
          {String(shipIds.length).padStart(2, '0')}
        </p>
        <h2 id="hangar-ship" className="hangar__name">
          {ship.name}
        </h2>
        <p className="hangar__model">
          <span>{ship.model}</span>
          <span>{t.classes[ship.kind]}</span>
        </p>
        <p className="hangar__maker">{ship.maker}</p>
        <p className="hangar__about">{t.ships[ship.id]}</p>
        <dl className="hangar__stats">
          {specs.map((spec, row) => {
            const { value, share } = specOf(ship, spec);
            const lit = Math.max(1, Math.round(1 + share * 9));
            return (
              <div
                key={spec}
                className="stat"
                style={{ '--row': row } as CSSProperties}
              >
                <dt className="g-label">{t[spec]}</dt>
                <dd className="stat__meter" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, segment) => (
                    <span
                      key={segment}
                      className={segment < lit ? 'is-on' : undefined}
                    />
                  ))}
                </dd>
                <dd className="stat__value g-num">
                  {spec === 'boost' ? `×${value.toFixed(2)}` : value.toFixed(0)}
                  {units[spec] && <small>{units[spec]}</small>}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      {/* On smaller screens the dock is pinned to the bottom of the
          screen, on a band of its own. */}
      <div className="hangar__dock">
        <button
          type="button"
          className="g-btn g-btn--primary hangar__launch"
          aria-disabled={launching || undefined}
          onClick={onTakeOff}
        >
          <FontAwesomeIcon icon={faRocket} />
          {launching ? t.launching : t.takeOff}
          {!launching && <Keycap>Enter</Keycap>}
        </button>
      </div>
    </section>
  );
}

// Where the ship is chosen, before the flight: a terminal of the hangar,
// with the ship on its pedestal, its sheet, and the roster of the six, a
// group of radio buttons that the arrows, Home, End and 1 to 6 move
// through. Enter takes off.
export default function Hangar({
  shipId,
  onChoose,
  onIgnite,
  onTakeOff,
  home,
}: Readonly<HangarProps>) {
  const t = useI18n().messages.game;
  const ship = ships[shipId];
  const index = shipIds.indexOf(shipId);
  const roster = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [launching, setLaunching] = useState(false);
  const launchTimer = useRef(0);

  // A hangar comes in with no launch under way, whenever its 3D stage
  // mounts.
  useEffect(() => {
    spin.launch = -1;
    return () => window.clearTimeout(launchTimer.current);
  }, []);

  // Takes off: the launch plays on the stage while the hangar dims, and
  // the flight takes over when it ends; at once, for those who ask for
  // less motion. A second press during the launch does nothing.
  const launch = () => {
    if (launching) return;
    onIgnite();
    if (reduced) {
      onTakeOff();
      return;
    }
    spin.launch = 0;
    setLaunching(true);
    // On a phone the pilot may be down by the sheet: the stage comes into
    // view, to see the ship go.
    const stage = spin.stage?.getBoundingClientRect();
    if (stage && (stage.top < 0 || stage.bottom > window.innerHeight)) {
      spin.stage?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    launchTimer.current = window.setTimeout(onTakeOff, launchTime);
  };

  const pick = (id: ShipId, focus = false) => {
    onChoose(id);
    if (focus) {
      roster.current
        ?.querySelector<HTMLButtonElement>(`[data-ship="${id}"]`)
        ?.focus();
    }
  };

  const onRosterKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (launching) return;
    const last = shipIds.length - 1;
    let next = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = index === last ? 0 : index + 1;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = index === 0 ? last : index - 1;
    } else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next < 0) return;
    event.preventDefault();
    pick(shipIds[next], true);
  };

  // Enter takes off, and 1 to 6 pick a ship, unless a link or a button
  // other than a ship has the focus. During the launch, the ship that
  // leaves is the one that flies.
  const onKey = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (launching) return;
    const target = event.target as HTMLElement | null;
    const busy =
      target?.closest('a, input, textarea, select') ||
      (target?.closest('button') && !target.closest('[data-ship]'));
    if (busy) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      launch();
      return;
    }
    const number = Number(event.key);
    if (Number.isInteger(number) && number >= 1 && number <= shipIds.length) {
      pick(shipIds[number - 1], target?.closest('[data-ship]') !== null);
    }
  });

  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => onKey(event);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);

  return (
    <div className="hangar" data-launching={launching ? '' : undefined}>
      <header className="hangar__top">
        <a className="g-btn hangar__back" href={home}>
          <FontAwesomeIcon icon={faArrowLeft} />
          {t.backToSite}
        </a>
        <p className="g-label hangar__ready">
          <span className="hangar__ready-light" aria-hidden="true" />
          {format(t.shipsReady, { count: String(shipIds.length) })}
        </p>
      </header>
      <div className="hangar__layout">
        <div className="hangar__head">
          <p className="g-label hangar__eyebrow">{t.hangar}</p>
          <h1 className="hangar__title">{t.chooseShip}</h1>
        </div>
        <Stage ship={ship} index={index} launching={launching} />
        <div
          ref={roster}
          className="hangar__roster"
          role="radiogroup"
          aria-label={t.roster}
          onKeyDown={onRosterKey}
        >
          {shipIds.map((id, position) => (
            <button
              key={id}
              type="button"
              role="radio"
              className="hangar__ship"
              data-ship={id}
              aria-checked={id === shipId}
              aria-label={ships[id].name}
              tabIndex={id === shipId ? 0 : -1}
              onClick={() => pick(id)}
            >
              <span className="hangar__ship-index g-num" aria-hidden="true">
                {String(position + 1).padStart(2, '0')}
              </span>
              <ShipGlyph ship={ships[id]} className="hangar__ship-glyph" />
              <span className="hangar__ship-name">{ships[id].name}</span>
              <span className="hangar__ship-model" aria-hidden="true">
                {ships[id].model}
              </span>
            </button>
          ))}
        </div>
        <Sheet
          ship={ship}
          index={index}
          launching={launching}
          onTakeOff={launch}
        />
      </div>
    </div>
  );
}
