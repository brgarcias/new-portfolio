import type * as THREE from 'three';
import type { Handling } from '../physics';
import { buildAWing } from './awing';
import { buildFalcon } from './falcon';
import { buildN1 } from './n1';
import { buildTieFighter } from './tie';
import { buildXWing } from './xwing';
import { buildYWing } from './ywing';

// The ships of the hangar, each with its own handling. The names are the
// ships' own; the models are ours, built from simple shapes in the files
// beside this one.
export const shipIds = [
  'xwing',
  'tie',
  'falcon',
  'awing',
  'ywing',
  'n1',
] as const;

export type ShipId = (typeof shipIds)[number];

export interface Ship {
  id: ShipId;
  name: string;
  handling: Handling;
  // How high over the platform it flies.
  hover: number;
  build: () => THREE.Group;
}

export const ships: Record<ShipId, Ship> = {
  xwing: {
    id: 'xwing',
    name: 'X-wing',
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

// Each trait from 1 to 5, for the bars of the hangar.
export function rating(ship: Ship) {
  const scale = (value: number, min: number, max: number) =>
    Math.round(1 + (4 * (value - min)) / (max - min));
  const { maxSpeed, turnRate, boost } = ship.handling;
  return {
    speed: scale(maxSpeed, 18, 34),
    agility: scale(turnRate, 1.3, 3.4),
    boost: scale(boost, 1.2, 2),
  };
}

export const isShipId = (value: string | null): value is ShipId =>
  (shipIds as readonly string[]).includes(value ?? '');
