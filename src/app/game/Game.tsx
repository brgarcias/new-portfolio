'use client';

// HOOKS
import { useEffect, useMemo, useState } from 'react';
// THREE
import { Canvas } from '@react-three/fiber';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { listenToKeyboard } from './controls';
import Hangar from './Hangar';
import Hud from './Hud';
import Labels from './Labels';
import { overlay } from './overlay';
import Ship from './Ship';
import { isShipId, ships, type ShipId } from './ships';
import type { Place } from './types';
import { pads } from './world/arena';
import World from './world/World';

const storageKey = 'ship';

// The last ship flown waits in the hangar on the next visit.
function storedShip(): ShipId {
  try {
    const stored = localStorage.getItem(storageKey);
    return isShipId(stored) ? stored : 'xwing';
  } catch {
    return 'xwing';
  }
}

const registerLabels = (element: HTMLDivElement | null) => {
  overlay.labels = element;
};

interface GameProps {
  places: Place[];
  home: string;
}

// The game: the hangar, then the flight over the arena. Loaded by index.tsx
// only in the browser, once it knows it can draw 3D, so the stored ship
// can be read right away.
export default function Game({ places, home }: Readonly<GameProps>) {
  const [shipId, setShipId] = useState(storedShip);
  const [flying, setFlying] = useState(false);
  const [pad, setPad] = useState<SectionId | null>(null);
  const titles = useMemo(
    () => Object.fromEntries(places.map((place) => [place.id, place.title])),
    [places],
  );

  useEffect(() => {
    if (!flying) return;
    return listenToKeyboard();
  }, [flying]);

  const choose = (id: ShipId) => {
    setShipId(id);
    try {
      localStorage.setItem(storageKey, id);
    } catch {}
  };

  if (!flying) {
    return (
      <Hangar
        shipId={shipId}
        onChoose={choose}
        onTakeOff={() => setFlying(true)}
        home={home}
      />
    );
  }

  return (
    <div className="game">
      <Canvas
        className="game__canvas"
        dpr={[1, 1.5]}
        camera={{ fov: 55, near: 0.5, far: 1400, position: [0, 8, 14] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <World activePad={pad} />
        <Ship ship={ships[shipId]} onPad={setPad} />
        <Labels />
      </Canvas>
      <div ref={registerLabels} className="game__labels" aria-hidden="true">
        {pads.map((landingPad) => (
          <span key={landingPad.id} className="game__label">
            {titles[landingPad.id]}
          </span>
        ))}
      </div>
      <Hud
        ship={ships[shipId]}
        pad={pad && titles[pad]}
        home={home}
        onChangeShip={() => {
          setPad(null);
          setFlying(false);
        }}
      />
    </div>
  );
}
