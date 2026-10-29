'use client';

// HOOKS
import { useEffect, useMemo, useState, type ReactNode } from 'react';
// THREE
import { Canvas } from '@react-three/fiber';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { listenToKeyboard, resetInput } from './controls';
import Hangar from './Hangar';
import Hud from './Hud';
import Labels from './Labels';
import { overlay } from './overlay';
import Panel from './Panel';
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

export interface GameProps {
  places: Place[];
  home: string;
  // The sections of the site, one per place, to show on landing.
  panels: Partial<Record<SectionId, ReactNode>>;
}

// The game: the hangar, then the flight over the arena, and the section
// of the site that opens when the ship stops on a pad. Loaded by index.tsx
// only in the browser, once it knows it can draw 3D, so the stored ship
// can be read right away.
export default function Game({ places, home, panels }: Readonly<GameProps>) {
  const [shipId, setShipId] = useState(storedShip);
  const [flying, setFlying] = useState(false);
  const [pad, setPad] = useState<SectionId | null>(null);
  const [open, setOpen] = useState<SectionId | null>(null);
  const [visited, setVisited] = useState<SectionId[]>([]);
  const titles = useMemo(
    () => Object.fromEntries(places.map((place) => [place.id, place.title])),
    [places],
  );

  // The keyboard flies the ship, except while a section is open.
  useEffect(() => {
    if (!flying || open) return;
    return listenToKeyboard();
  }, [flying, open]);

  const choose = (id: ShipId) => {
    setShipId(id);
    try {
      localStorage.setItem(storageKey, id);
    } catch {}
  };

  const land = (id: SectionId) => {
    resetInput();
    setVisited((list) => (list.includes(id) ? list : [...list, id]));
    setOpen(id);
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
        <World activePad={pad} visited={visited} />
        <Ship ship={ships[shipId]} onPad={setPad} onLand={land} />
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
        visited={visited.length}
        total={places.length}
        home={home}
        onChangeShip={() => {
          setPad(null);
          setFlying(false);
        }}
      />
      {open && (
        <Panel id={open} home={home} onClose={() => setOpen(null)}>
          {panels[open]}
        </Panel>
      )}
    </div>
  );
}
