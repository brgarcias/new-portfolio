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
import type { Holocrons } from '@/src/content';
import type { SectionId } from '@/src/content/sections';
// GAME
import Adaptive from './Adaptive';
import Archive from './Archive';
import { listenToKeyboard, resetInput } from './controls';
import Hangar from './Hangar';
import Hud from './Hud';
import { hunt } from './hunt';
import Labels from './Labels';
import { overlay } from './overlay';
import Panel from './Panel';
import { loadProgress, saveProgress } from './progress';
import Ship from './Ship';
import Snapshot from './Snapshot';
import { play, setSound, storedSound } from './sound';
import { isShipId, ships, type ShipId } from './ships';
import { navigation, telemetry } from './telemetry';
import { hudModes, type HudMode, type Place, type Toast } from './types';
import { useReducedMotion } from './useMediaQuery';
import { pads, spawn } from './world/arena';
import { biomes } from './world/biomes';
import World from './world/World';

const storageKey = 'ship';
const hudKey = 'hud';
// How long a notice stays, how long a planet's title shows, and how long
// the finale of the holocrons lasts.
const toastTime = 5200;
const titleTime = 3400;
const finaleTime = 7400;
// The mission's notice, when an exploration begins, stays longer, to be
// read; the controls come up for a pilot still in place a while after the
// arrival, once that notice is gone.
const briefingTime = 8000;
const hintDelay = 9000;
// How long the chart, the archive and a section take to fade out when they
// close, and the flight when the pilot goes back to the hangar.
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

// The HUD as the pilot left it.
function storedHud(): HudMode {
  try {
    const stored = localStorage.getItem(hudKey);
    return hudModes.find((mode) => mode === stored) ?? 'full';
  } catch {
    return 'full';
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
  // The record each holocron unlocks in the archive.
  records: Holocrons;
}

// The game: the hangar, then the flight over the arena, and the section
// of the site that opens when the ship stops on a pad. Loaded by index.tsx
// only in the browser, once it knows it can draw 3D, so the stored ship
// and the progress kept from earlier visits can be read right away.
export default function Game({
  places,
  home,
  panels,
  records,
}: Readonly<GameProps>) {
  const [shipId, setShipId] = useState(storedShip);
  const [flying, setFlying] = useState(false);
  const [pad, setPad] = useState<SectionId | null>(null);
  const [open, setOpen] = useState<SectionId | null>(null);
  // A section read from the chart, without landing on its planet.
  const [remote, setRemote] = useState(false);
  const [saved] = useState(loadProgress);
  const [visited, setVisited] = useState(saved.visited);
  const [found, setFound] = useState(saved.found);
  const [read, setRead] = useState(saved.read);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveLeaving, setArchiveLeaving] = useState(false);
  // The records new to this opening of the archive, and the one it shows
  // first.
  const [fresh, setFresh] = useState<SectionId[]>([]);
  const [archiveFocus, setArchiveFocus] = useState<SectionId | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [course, setCourse] = useState<SectionId | null>(null);
  const [soundOn, setSoundOn] = useState(storedSound);
  const [hudMode, setHudMode] = useState(storedHud);
  // How many times a flight has arrived from hyperspace, in the page.
  const [arrivals, setArrivals] = useState(0);
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
  const explored = useRef(saved.visited.length >= places.length);
  const briefed = useRef(false);
  const hinted = useRef(false);
  const timers = useRef({
    map: 0,
    archive: 0,
    panel: 0,
    depart: 0,
    title: 0,
  });

  useEffect(() => {
    const pending = timers.current;
    return () => {
      window.clearTimeout(pending.map);
      window.clearTimeout(pending.archive);
      window.clearTimeout(pending.panel);
      window.clearTimeout(pending.depart);
      window.clearTimeout(pending.title);
    };
  }, []);
  // The holocrons recovered on earlier visits stay recovered: the world,
  // the radar and the compass read them from the hunt.
  useEffect(() => {
    for (const id of saved.found) hunt.found.add(id);
  }, [saved]);
  // Every step of the exploration is kept for the next visit.
  useEffect(() => {
    saveProgress({ visited, found, read });
  }, [visited, found, read]);
  const titles = useMemo(
    () => Object.fromEntries(places.map((place) => [place.id, place.title])),
    [places],
  );

  // The keyboard flies the ship, except while a section, the chart or the
  // archive is open.
  useEffect(() => {
    if (!flying || open || mapOpen || archiveOpen) return;
    return listenToKeyboard();
  }, [flying, open, mapOpen, archiveOpen]);
  // The sound comes on with the stored choice, once the game is on.
  useEffect(() => {
    if (flying && soundOn) setSound(true);
  }, [flying, soundOn]);
  // The chart opens at once, and fades out when it closes; opening it again
  // while it fades out keeps it.
  const openMap = () => {
    window.clearTimeout(timers.current.map);
    window.clearTimeout(timers.current.archive);
    setArchiveOpen(false);
    setArchiveLeaving(false);
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

  // The archive opens on the record just unlocked, if one was, and marks
  // every record unlocked as read; the chart closes, as only one dialog
  // shows at a time.
  const openArchive = () => {
    const unread = found.filter((id) => !read.includes(id));
    window.clearTimeout(timers.current.map);
    window.clearTimeout(timers.current.archive);
    setMapOpen(false);
    setMapLeaving(false);
    setFresh(unread);
    setArchiveFocus(unread.at(-1) ?? null);
    setRead(found);
    setArchiveLeaving(false);
    setArchiveOpen(true);
    play('blip');
  };
  const closeArchive = () => {
    window.clearTimeout(timers.current.archive);
    if (reduced) {
      setArchiveOpen(false);
      return;
    }
    setArchiveLeaving(true);
    timers.current.archive = window.setTimeout(() => {
      setArchiveOpen(false);
      setArchiveLeaving(false);
    }, exitTime);
  };

  // The HUD goes from full to minimal to immersive and back, and stays so
  // for the next visit.
  const cycleHud = () => {
    const next = hudModes[(hudModes.indexOf(hudMode) + 1) % hudModes.length];
    setHudMode(next);
    try {
      localStorage.setItem(hudKey, next);
    } catch {}
  };

  // M opens and closes the chart, H the archive, P the photo mode, which
  // Escape leaves too.
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
    } else if (event.code === 'KeyH') {
      event.preventDefault();
      if (archiveOpen && !archiveLeaving) {
        play('blip');
        closeArchive();
      } else {
        openArchive();
      }
    } else if (event.code === 'KeyV') {
      event.preventDefault();
      cycleHud();
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
  const notify = (toast: Omit<Toast, 'key'>, time = toastTime) => {
    toastKey.current += 1;
    const key = toastKey.current;
    setToasts((list) => [...list.slice(-2), { ...toast, key }]);
    window.setTimeout(
      () => setToasts((list) => list.filter((item) => item.key !== key)),
      time,
    );
  };

  // A new exploration begins with the mission, once the arrival from
  // hyperspace is over, so the two never share the screen: on the first
  // flight with nothing found yet, and after starting over.
  const brief = () => {
    briefed.current = true;
    notify({ kind: 'briefing', id: places[0].id, count: 0 }, briefingTime);
  };
  const arrived = () => {
    if (!briefed.current && !found.length && !visited.length) brief();
    setArrivals((count) => count + 1);
  };
  // A pilot still where the flight began, a while after the arrival, with
  // nothing open, gets the controls, once in the page.
  const hintIfStill = useEffectEvent(() => {
    if (hinted.current || open || mapOpen || archiveOpen) return;
    const away = Math.hypot(telemetry.x - spawn.x, telemetry.z - spawn.z);
    if (telemetry.speed > 0.5 || away > 3) return;
    hinted.current = true;
    notify({ kind: 'hint', id: places[0].id, count: 0 }, briefingTime);
  });
  useEffect(() => {
    if (!arrivals || !flying) return;
    const timer = window.setTimeout(hintIfStill, hintDelay);
    return () => window.clearTimeout(timer);
  }, [arrivals, flying]);

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
      notify({
        kind: 'holocron',
        id,
        count: hunt.found.size,
        record: records[id].title,
      });
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
    window.clearTimeout(timers.current.archive);
    setMapLeaving(false);
    setPanelLeaving(false);
    setMapOpen(false);
    setArchiveOpen(false);
    setArchiveLeaving(false);
    setRemote(false);
    setVisited((list) => (list.includes(id) ? list : [...list, id]));
    if (navigation.course === id) {
      setCourse(null);
      navigation.course = null;
    }
    setOpen(id);
  };

  // A section read from the chart, without flying there: the ship stays
  // where it is, and the planet is not counted as explored.
  const readRemotely = (id: SectionId) => {
    resetInput();
    window.clearTimeout(timers.current.map);
    window.clearTimeout(timers.current.panel);
    setMapLeaving(false);
    setMapOpen(false);
    setPanelLeaving(false);
    setRemote(true);
    setOpen(id);
    play('blip');
  };

  // A new exploration: the holocrons go back to their planets, the pads
  // and the archive start over, and the mission comes back.
  const startOver = () => {
    hunt.found.clear();
    hunt.age.clear();
    hunt.entered.clear();
    setVisited([]);
    setFound([]);
    setRead([]);
    setFresh([]);
    setFinale(false);
    setCourse(null);
    navigation.course = null;
    explored.current = false;
    closeArchive();
    brief();
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

  // Back to the hangar: the flight fades to black, and the hangar comes in,
  // and the flight's notices go with it.
  const changeShip = () => {
    const done = () => {
      setDeparting(false);
      setFlying(false);
      setToasts([]);
    };
    setPad(null);
    window.clearTimeout(timers.current.map);
    window.clearTimeout(timers.current.archive);
    setMapLeaving(false);
    setMapOpen(false);
    setArchiveOpen(false);
    setArchiveLeaving(false);
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
          onArrived={arrived}
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
        onRead={readRemotely}
        archiveOpen={archiveOpen}
        unread={found.filter((id) => !read.includes(id)).length}
        onOpenArchive={openArchive}
        course={course}
        onCourse={steer}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        hudMode={hudMode}
        onHudMode={cycleHud}
        photo={photo}
        onPhoto={setPhoto}
        toasts={toasts}
        title={title}
        finale={finale}
      />
      {archiveOpen && (
        <Archive
          leaving={archiveLeaving}
          places={places}
          records={records}
          found={found}
          fresh={fresh}
          focus={archiveFocus}
          course={course}
          onCourse={steer}
          started={found.length > 0 || visited.length > 0}
          onStartOver={startOver}
          home={home}
          onClose={closeArchive}
        />
      )}
      {open && (
        <Panel
          id={open}
          home={home}
          remote={remote}
          leaving={panelLeaving}
          onClose={closePanel}
        >
          {panels[open]}
        </Panel>
      )}
    </div>
  );
}
