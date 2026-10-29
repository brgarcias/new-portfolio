'use client';

// HOOKS
import { useEffect, useMemo, useRef } from 'react';
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

// The chosen ship, turning slowly on its pedestal.
function Preview({ shipId }: { shipId: ShipId }) {
  const model = useMemo(() => ships[shipId].build(), [shipId]);
  const stand = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  useEffect(
    () => () =>
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      }),
    [model],
  );

  useFrame((_, delta) => {
    if (!stand.current || reduced) return;
    stand.current.rotation.y += delta * 0.45;
  });

  return (
    <>
      <hemisphereLight args={['#8d8fff', '#15161f', 1]} />
      <directionalLight position={[5, 8, 6]} intensity={1.6} color="#fff2e0" />
      <directionalLight
        position={[-6, 3, -4]}
        intensity={0.5}
        color="#5c5edc"
      />
      <group ref={stand} rotation-y={reduced ? 0.6 : 0}>
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
        <div className="hangar__stage">
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
        </div>
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
