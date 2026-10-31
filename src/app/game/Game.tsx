'use client';

// HOOKS
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
// THREE
import { Canvas } from '@react-three/fiber';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import Adaptive from './Adaptive';
import { listenToKeyboard, resetInput } from './controls';
import Hangar from './Hangar';
import Hud from './Hud';
import { hunt } from './hunt';
import Labels from './Labels';
import { overlay } from './overlay';
import Panel from './Panel';
import Ship from './Ship';
import Snapshot from './Snapshot';
import { play, setSound, storedSound } from './sound';
import { isShipId, ships, type ShipId } from './ships';
import { navigation } from './telemetry';
import type { Place, Toast } from './types';
import { useReducedMotion } from './useMediaQuery';
import { pads } from './world/arena';
import { biomes } from './world/biomes';
import World from './world/World';

const storageKey = 'ship';
// How long a notice stays, how long a planet's title shows, and how long
// the finale of the holocrons lasts.
const toastTime = 5200;
const titleTime = 3400;
const finaleTime = 7400;
// How long the chart and a section take to fade out when they close, and
// the flight when the pilot goes back to the hangar.
const exitTime = 180;
const departTime = 380;

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
  const [found, setFound] = useState<SectionId[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [course, setCourse] = useState<SectionId | null>(null);
  const [soundOn, setSoundOn] = useState(storedSound);
  const [photo, setPhoto] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [finale, setFinale] = useState(false);
  const [mapLeaving, setMapLeaving] = useState(false);
  const [panelLeaving, setPanelLeaving] = useState(false);
  const [departing, setDeparting] = useState(false);
  // The planet whose title shows, the first time the ship enters it.
  const [title, setTitle] = useState<{ id: SectionId; key: number } | null>(
    null,
  );
  const reduced = useReducedMotion();
  const toastKey = useRef(0);
  const explored = useRef(false);
  const timers = useRef({ map: 0, panel: 0, depart: 0, title: 0 });

  useEffect(() => {
    const pending = timers.current;
    return () => {
      window.clearTimeout(pending.map);
      window.clearTimeout(pending.panel);
      window.clearTimeout(pending.depart);
      window.clearTimeout(pending.title);
    };
  }, []);
  const titles = useMemo(
    () => Object.fromEntries(places.map((place) => [place.id, place.title])),
    [places],
  );

  // The keyboard flies the ship, except while a section or the chart is
  // open.
  useEffect(() => {
    if (!flying || open || mapOpen) return;
    return listenToKeyboard();
  }, [flying, open, mapOpen]);
  // The sound comes on with the stored choice, once the game is on.
  useEffect(() => {
    if (flying && soundOn) setSound(true);
  }, [flying, soundOn]);
  // The chart opens at once, and fades out when it closes; opening it again
  // while it fades out keeps it.
  const openMap = () => {
    window.clearTimeout(timers.current.map);
    setMapLeaving(false);
    setMapOpen(true);
    play('blip');
  };
  const closeMap = () => {
    window.clearTimeout(timers.current.map);
    if (reduced) {
      setMapOpen(false);
      return;
    }
    setMapLeaving(true);
    timers.current.map = window.setTimeout(() => {
      setMapOpen(false);
      setMapLeaving(false);
    }, exitTime);
  };

  // M opens and closes the chart, P the photo mode, which Escape leaves too.
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.repeat) return;
    if (event.code === 'KeyM') {
      event.preventDefault();
      if (mapOpen && !mapLeaving) {
        play('blip');
        closeMap();
      } else {
        openMap();
      }
    } else if (event.code === 'KeyP') {
      event.preventDefault();
      setPhoto((value) => !value);
    } else if (event.key === 'Escape') {
      setPhoto(false);
    }
  });
  useEffect(() => {
    if (!flying || open) return;
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [flying, open]);

  const choose = (id: ShipId) => {
    setShipId(id);
    try {
      localStorage.setItem(storageKey, id);
    } catch {}
  };

  const toggleSound = () => {
    const on = !soundOn;
    setSoundOn(on);
    setSound(on);
  };

  // A notice for a moment; no more than three at once.
  const notify = (toast: Omit<Toast, 'key'>) => {
    toastKey.current += 1;
    const key = toastKey.current;
    setToasts((list) => [...list.slice(-2), { ...toast, key }]);
    window.setTimeout(
      () => setToasts((list) => list.filter((item) => item.key !== key)),
      toastTime,
    );
  };

  const steer = (id: SectionId) => {
    const next = course === id ? null : id;
    setCourse(next);
    navigation.course = next;
    play('blip');
  };

  const collect = (id: SectionId) => {
    setFound((list) => (list.includes(id) ? list : [...list, id]));
    if (hunt.found.size >= places.length) {
      setFinale(true);
      window.setTimeout(() => setFinale(false), finaleTime);
    } else {
      notify({ kind: 'holocron', id, count: hunt.found.size });
    }
  };

  // A planet's title, the first time the ship enters it; the next planet's
  // takes its place.
  const enter = (id: SectionId) => {
    window.clearTimeout(timers.current.title);
    toastKey.current += 1;
    setTitle({ id, key: toastKey.current });
    timers.current.title = window.setTimeout(() => setTitle(null), titleTime);
  };

  const land = (id: SectionId) => {
    resetInput();
    window.clearTimeout(timers.current.map);
    window.clearTimeout(timers.current.panel);
    setMapLeaving(false);
    setPanelLeaving(false);
    setMapOpen(false);
    setVisited((list) => (list.includes(id) ? list : [...list, id]));
    if (navigation.course === id) {
      setCourse(null);
      navigation.course = null;
    }
    setOpen(id);
  };

  // Back to the flight, once the section has faded out; the first time
  // every section has been seen, the log says so.
  const closePanel = () => {
    const id = open;
    const done = () => {
      setOpen(null);
      setPanelLeaving(false);
      if (id && !explored.current && visited.length >= places.length) {
        explored.current = true;
        notify({ kind: 'explored', id, count: visited.length });
      }
    };
    window.clearTimeout(timers.current.panel);
    if (reduced) {
      done();
      return;
    }
    setPanelLeaving(true);
    timers.current.panel = window.setTimeout(done, exitTime);
  };

  // Back to the hangar: the flight fades to black, and the hangar comes in.
  const changeShip = () => {
    const done = () => {
      setDeparting(false);
      setFlying(false);
    };
    setPad(null);
    window.clearTimeout(timers.current.map);
    setMapLeaving(false);
    setMapOpen(false);
    setPhoto(false);
    window.clearTimeout(timers.current.title);
    setTitle(null);
    window.clearTimeout(timers.current.depart);
    if (reduced) {
      done();
      return;
    }
    setDeparting(true);
    timers.current.depart = window.setTimeout(done, departTime);
  };

  if (!flying) {
    return (
      <Hangar
        shipId={shipId}
        onChoose={choose}
        onIgnite={() => {
          if (soundOn) {
            setSound(true);
            play('takeoff');
          }
        }}
        onTakeOff={() => setFlying(true)}
        home={home}
      />
    );
  }

  return (
    <div className="game" data-departing={departing ? '' : undefined}>
      <Canvas
        className="game__canvas"
        dpr={[1, 1.5]}
        camera={{ fov: 55, near: 0.5, far: 1400, position: [0, 8, 14] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <World activePad={pad} visited={visited} course={course} />
        <Ship
          ship={ships[shipId]}
          onPad={setPad}
          onLand={land}
          onCollect={collect}
          onEnter={enter}
        />
        <Labels />
        <Adaptive />
        <Snapshot />
      </Canvas>
      <div ref={registerLabels} className="game__labels" aria-hidden="true">
        {pads.map((landingPad) => (
          <span
            key={landingPad.id}
            className="game__label"
            data-id={landingPad.id}
            style={
              { '--accent': biomes[landingPad.id].accent } as CSSProperties
            }
          >
            <span className="game__label-planet">
              {biomes[landingPad.id].planet}
            </span>
            <span className="game__label-title">{titles[landingPad.id]}</span>
            <span className="game__label-distance g-num" data-distance="">
              — m
            </span>
          </span>
        ))}
      </div>
      <Hud
        ship={ships[shipId]}
        pad={pad}
        places={places}
        visited={visited}
        found={found}
        home={home}
        onChangeShip={changeShip}
        mapOpen={mapOpen}
        mapLeaving={mapLeaving}
        onOpenMap={openMap}
        onCloseMap={closeMap}
        course={course}
        onCourse={steer}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        photo={photo}
        onPhoto={setPhoto}
        toasts={toasts}
        title={title}
        finale={finale}
      />
      {open && (
        <Panel
          id={open}
          home={home}
          leaving={panelLeaving}
          onClose={closePanel}
        >
          {panels[open]}
        </Panel>
      )}
    </div>
  );
}
