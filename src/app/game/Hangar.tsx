'use client';

// HOOKS
import { useEffect, useMemo, useRef, type PointerEvent } from 'react';
// THREE
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faRocket } from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// GAME
import { rating, shipIds, ships, type ShipId } from './ships';
import { useReducedMotion } from './useMediaQuery';

interface HangarProps {
  shipId: ShipId;
  onChoose: (id: ShipId) => void;
  onTakeOff: () => void;
  // The address of the site in the page's language.
  home: string;
}

// How the ship on the pedestal is turned: by itself, slowly, or by a
// finger or the mouse dragged across the stage, which spins it and lets
// it coast to a stop, as a wheel would. The frame loop reads it; the
// stage reports the turn as a data attribute.
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
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// The chosen ship, turning on its pedestal.
function Preview({ shipId }: { shipId: ShipId }) {
  const model = useMemo(() => ships[shipId].build(), [shipId]);
  const stand = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    spin.yaw = reduced ? 0.6 : 0;
    spin.pitch = 0;
    spin.velocity = 0;
    spin.tilt = 0;
    spin.idle = 10;
  }, [reduced]);

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
    stand.current.scale.setScalar(grow);
    stand.current.rotation.y = spin.yaw;
    stand.current.rotation.x = spin.pitch;
    if (spin.stage) {
      spin.stage.dataset.yaw = spin.yaw.toFixed(2);
      spin.stage.dataset.pitch = spin.pitch.toFixed(2);
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
      <mesh rotation-x={-Math.PI / 2} position-y={-1.6}>
        <ringGeometry args={[3.2, 3.6, 48]} />
        <meshBasicMaterial color="#5c5edc" transparent opacity={0.8} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-1.62}>
        <circleGeometry args={[3.2, 48]} />
        <meshBasicMaterial color="#1b1d2b" />
      </mesh>
    </>
  );
}

const registerStage = (element: HTMLDivElement | null) => {
  spin.stage = element;
};

// The stage, where a drag turns the ship.
function Stage({ shipId, hint }: { shipId: ShipId; hint: string }) {
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
          position: [6.5, 3.2, -8.5],
        }}
      >
        <Preview shipId={shipId} />
      </Canvas>
      <p className="hangar__hint">{hint}</p>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="hangar__stat">
      <dt>{label}</dt>
      <dd aria-label={`${value}/5`}>
        {[1, 2, 3, 4, 5].map((level) => (
          <span key={level} className={level <= value ? 'is-on' : undefined} />
        ))}
      </dd>
    </div>
  );
}

// Where the ship is chosen, before the flight.
export default function Hangar({
  shipId,
  onChoose,
  onTakeOff,
  home,
}: Readonly<HangarProps>) {
  const t = useI18n().messages.game;
  const ship = ships[shipId];
  const stats = rating(ship);

  return (
    <div className="hangar">
      <header className="hangar__top">
        <a className="btn btn--ghost btn--small" href={home}>
          <FontAwesomeIcon icon={faArrowLeft} />
          {t.backToSite}
        </a>
      </header>
      <div className="hangar__inner">
        <p className="eyebrow">{t.hangar}</p>
        <h1 className="hangar__title">{t.chooseShip}</h1>
        <Stage shipId={shipId} hint={t.dragToTurn} />
        <ul className="hangar__ships">
          {shipIds.map((id) => (
            <li key={id}>
              <button
                type="button"
                className="hangar__ship"
                aria-pressed={id === shipId}
                onClick={() => onChoose(id)}
              >
                {ships[id].name}
              </button>
            </li>
          ))}
        </ul>
        <div className="hangar__info">
          <h2 className="hangar__name">{ship.name}</h2>
          <p className="hangar__about">{t.ships[shipId]}</p>
          <dl className="hangar__stats">
            <Bar label={t.speed} value={stats.speed} />
            <Bar label={t.agility} value={stats.agility} />
            <Bar label={t.boost} value={stats.boost} />
          </dl>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onTakeOff}
          >
            <FontAwesomeIcon icon={faRocket} />
            {t.takeOff}
          </button>
        </div>
      </div>
    </div>
  );
}
