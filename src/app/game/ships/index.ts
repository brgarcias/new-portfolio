import type * as THREE from 'three';
import type { Handling } from '../physics';
import { buildAWing } from './awing';
import { buildFalcon } from './falcon';
import { buildN1 } from './n1';
import { buildTieFighter } from './tie';
import { buildXWing } from './xwing';
import { buildYWing } from './ywing';

// The ships of the hangar, each with its own handling. The names, models
// and makers are the ships' own, from the saga; the 3D models are ours,
// built from simple shapes in the files beside this one, and so are the
// line drawings.
export const shipIds = [
  'xwing',
  'tie',
  'falcon',
  'awing',
  'ywing',
  'n1',
] as const;

export type ShipId = (typeof shipIds)[number];

export type ShipClass = 'starfighter' | 'interceptor' | 'freighter' | 'bomber';

export interface Ship {
  id: ShipId;
  name: string;
  // The model's designation and its maker, as the saga names them, and
  // the class of ship it is.
  model: string;
  maker: string;
  kind: ShipClass;
  // A line drawing of the ship, nose up, in a 48 by 48 box: seen from
  // above, but the TIE fighter from the front, where it is known.
  silhouette: string;
  handling: Handling;
  // How high over the platform it flies.
  hover: number;
  build: () => THREE.Group;
}

export const ships: Record<ShipId, Ship> = {
  xwing: {
    id: 'xwing',
    name: 'X-wing',
    model: 'T-65B',
    maker: 'Incom Corporation',
    kind: 'starfighter',
    silhouette:
      'M24 3L26 10L26.6 36L25 44H23L21.4 36L22 10Z' +
      'M22 28L6 31V35L21.6 36M26 28L42 31V35L26.4 36' +
      'M6 13V35M42 13V35M18 30H21V41H18ZM27 30H30V41H27Z' +
      'M22.6 15H25.4L25.6 19.5H22.4Z',
    handling: {
      maxSpeed: 26,
      acceleration: 18,
      turnRate: 2.2,
      boost: 1.5,
      radius: 2.2,
    },
    hover: 2.6,
    build: buildXWing,
  },
  tie: {
    id: 'tie',
    name: 'TIE fighter',
    model: 'TIE/ln',
    maker: 'Sienar Fleet Systems',
    kind: 'starfighter',
    silhouette:
      'M8 5L12 13V35L8 43L4 35V13Z' +
      'M40 5L44 13V35L40 43L36 35V13Z' +
      'M12 24H17.5M30.5 24H36' +
      'M17.5 24A6.5 6.5 0 1 0 30.5 24A6.5 6.5 0 1 0 17.5 24Z' +
      'M21 24A3 3 0 1 0 27 24A3 3 0 1 0 21 24Z',
    handling: {
      maxSpeed: 30,
      acceleration: 24,
      turnRate: 2.8,
      boost: 1.35,
      radius: 2.3,
    },
    hover: 3,
    build: buildTieFighter,
  },
  falcon: {
    id: 'falcon',
    name: 'Millennium Falcon',
    model: 'YT-1300f',
    maker: 'Corellian Engineering Corporation',
    kind: 'freighter',
    silhouette:
      'M9 28A15 15 0 1 0 39 28A15 15 0 1 0 9 28Z' +
      'M18.5 15V4H22.6V13.4M29.5 15V4H25.4V13.4' +
      'M36.6 18.5L41.2 14' +
      'M41 12.5A2.5 2.5 0 1 0 46 12.5A2.5 2.5 0 1 0 41 12.5Z' +
      'M20 28A4 4 0 1 0 28 28A4 4 0 1 0 20 28Z',
    handling: {
      maxSpeed: 24,
      acceleration: 12,
      turnRate: 1.5,
      boost: 1.9,
      radius: 2.8,
    },
    hover: 2.4,
    build: buildFalcon,
  },
  awing: {
    id: 'awing',
    name: 'A-wing',
    model: 'RZ-1',
    maker: 'Kuat Systems Engineering',
    kind: 'interceptor',
    silhouette:
      'M24 4L40 38L35 42H13L8 38Z' +
      'M21 27A3 3 0 1 0 27 27A3 3 0 1 0 21 27Z' +
      'M24 10V21M16 42V45M20 42V45M28 42V45M32 42V45',
    handling: {
      maxSpeed: 32,
      acceleration: 22,
      turnRate: 3.2,
      boost: 1.4,
      radius: 1.8,
    },
    hover: 2.2,
    build: buildAWing,
  },
  ywing: {
    id: 'ywing',
    name: 'Y-wing',
    model: 'BTL-A4',
    maker: 'Koensayr Manufacturing',
    kind: 'bomber',
    silhouette:
      'M24 3L28 8V20H20V8Z' +
      'M22 20V24M26 20V24M13 24H35V28H13Z' +
      'M8 20A2.5 2.5 0 0 1 13 20V45H8Z' +
      'M35 20A2.5 2.5 0 0 1 40 20V45H35Z',
    handling: {
      maxSpeed: 20,
      acceleration: 10,
      turnRate: 1.6,
      boost: 1.3,
      radius: 2.4,
    },
    hover: 2.6,
    build: buildYWing,
  },
  n1: {
    id: 'n1',
    name: 'Naboo N-1 starfighter',
    model: 'N-1',
    maker: 'Theed Palace Space Vessel Engineering Corps',
    kind: 'starfighter',
    silhouette:
      'M24 3C27 10 28 18 28 26C28 32 26.5 36 24 37C21.5 36 20 32 20 26C20 18 21 10 24 3Z' +
      'M20.4 22L11.5 27V30.5L20.2 29.5M27.6 22L36.5 27V30.5L27.8 29.5' +
      'M7.5 19H11.5V40H7.5ZM36.5 19H40.5V40H36.5Z' +
      'M9.5 40V46M38.5 40V46M24 37V46' +
      'M22.5 13A1.5 3 0 1 0 25.5 13A1.5 3 0 1 0 22.5 13Z',
    handling: {
      maxSpeed: 28,
      acceleration: 20,
      turnRate: 2.5,
      boost: 1.5,
      radius: 2,
    },
    hover: 2.4,
    build: buildN1,
  },
};

// The figures of the hangar's sheet, from the ship's handling, each with
// where it falls between the slowest and the fastest ship of the hangar,
// for the meters.
export type Spec = 'speed' | 'acceleration' | 'agility' | 'boost';

const figures: Record<Spec, (handling: Handling) => number> = {
  speed: (handling) => handling.maxSpeed,
  acceleration: (handling) => handling.acceleration,
  // Degrees per second read better than radians.
  agility: (handling) => (handling.turnRate * 180) / Math.PI,
  boost: (handling) => handling.boost,
};

export const specs = Object.keys(figures) as Spec[];

export function specOf(ship: Ship, spec: Spec) {
  const values = shipIds.map((id) => figures[spec](ships[id].handling));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const value = figures[spec](ship.handling);
  return { value, share: max > min ? (value - min) / (max - min) : 1 };
}

export const isShipId = (value: string | null): value is ShipId =>
  (shipIds as readonly string[]).includes(value ?? '');
