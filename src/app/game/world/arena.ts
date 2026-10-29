import { sectionIds, type SectionId } from '@/src/content/sections';
import type { Arena, Obstacle, Pad } from '../physics';
import { angleOf, hubRadius, sectorAngle } from './biomes';

// The platform the ships fly over: a round world floating in space, with a
// landing pad for each section of the site around its edge, a sector per
// pad dressed as a planet (biomes.ts), and props in between to fly around.
// The props and the plants are placed by a fixed random sequence, so the
// world is the same on every visit.

export const platformRadius = 110;
export const padRadius = 9;
const padRing = 70;

export interface LandingPad extends Pad {
  id: SectionId;
  angle: number;
}

// The first pad lies straight ahead of where the ships start.
export const pads: LandingPad[] = sectionIds.map((id) => {
  const angle = angleOf(id);
  return {
    id,
    angle,
    x: Math.sin(angle) * padRing,
    z: -Math.cos(angle) * padRing,
    r: padRadius,
  };
});

export type PropKind = 'crate' | 'pillar' | 'mast' | 'rock';

export interface Prop extends Obstacle {
  kind: PropKind;
  height: number;
  rotation: number;
  sector: SectionId;
}

// A small random number generator with a seed (mulberry32).
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sectorOf = (x: number, z: number) => {
  const count = sectionIds.length;
  const index = Math.round(Math.atan2(x, -z) / sectorAngle);
  return sectionIds[((index % count) + count) % count];
};

// The way from the spawn to the first pad stays clear.
const inLane = (x: number, z: number, r: number) =>
  Math.abs(x) < 9 + r && z < 3 && z > -72;

function scatter(count: number, seed: number) {
  const next = random(seed);
  const between = (min: number, max: number) => min + next() * (max - min);
  const kinds: PropKind[] = [
    'crate',
    'crate',
    'pillar',
    'rock',
    'rock',
    'mast',
  ];
  const props: Prop[] = [];
  for (
    let attempt = 0;
    attempt < count * 20 && props.length < count;
    attempt++
  ) {
    const kind = kinds[Math.floor(next() * kinds.length)];
    const size = {
      crate: [between(1.6, 2.4), between(2.6, 4)],
      pillar: [between(0.9, 1.3), between(5, 9)],
      mast: [0.5, between(10, 14)],
      rock: [between(1.6, 3), 0],
    }[kind];
    const r = size[0];
    const height = kind === 'rock' ? r * 0.9 : size[1];
    const distance = between(20, platformRadius - 10);
    const angle = next() * Math.PI * 2;
    const x = Math.sin(angle) * distance;
    const z = Math.cos(angle) * distance;
    const prop: Prop = {
      kind,
      r,
      height,
      rotation: next() * Math.PI,
      x,
      z,
      sector: sectorOf(x, z),
    };
    // Clear of the pads, of the start and of each other.
    const clear =
      pads.every(
        (pad) => Math.hypot(prop.x - pad.x, prop.z - pad.z) > pad.r + r + 5,
      ) &&
      props.every(
        (other) =>
          Math.hypot(prop.x - other.x, prop.z - other.z) > other.r + r + 4,
      );
    if (clear) props.push(prop);
  }
  return props;
}

export const props = scatter(48, 2026);

// What grows, or stands, in each sector beyond the props: trees and the
// like are solid, and the ship bounces off them; the small plants are not.
export type FloraKind =
  | 'shrub'
  | 'bones'
  | 'lamp'
  | 'billboard'
  | 'mushroom'
  | 'reed'
  | 'wreck'
  | 'tree'
  | 'flowers'
  | 'redwood'
  | 'fern'
  | 'crystal';

export interface Flora extends Obstacle {
  kind: FloraKind;
  sector: SectionId;
  scale: number;
  rotation: number;
  solid: boolean;
}

const recipes: Partial<
  Record<SectionId, [FloraKind, number, number, boolean][]>
> = {
  about: [
    ['shrub', 10, 0.8, false],
    ['bones', 1, 4, true],
  ],
  experience: [
    ['lamp', 10, 0.3, false],
    ['billboard', 5, 1.2, false],
  ],
  education: [
    ['mushroom', 12, 0.5, false],
    ['reed', 8, 0.6, false],
    ['wreck', 1, 5, true],
  ],
  projects: [
    ['tree', 12, 1.1, true],
    ['flowers', 16, 0.6, false],
  ],
  contributing: [
    ['redwood', 22, 1.1, true],
    ['fern', 14, 0.6, false],
  ],
  contact: [['crystal', 10, 0.7, false]],
};

function grow(seed: number) {
  const next = random(seed);
  const between = (min: number, max: number) => min + next() * (max - min);
  const flora: Flora[] = [];
  for (const id of sectionIds) {
    for (const [kind, count, r, solid] of recipes[id] ?? []) {
      let placed = 0;
      for (let attempt = 0; attempt < count * 30 && placed < count; attempt++) {
        const angle = angleOf(id) + (next() * 2 - 1) * (sectorAngle / 2 - 0.06);
        const distance = between(hubRadius + 8, platformRadius - 7);
        const x = Math.sin(angle) * distance;
        const z = -Math.cos(angle) * distance;
        const clear =
          !inLane(x, z, r) &&
          pads.every(
            (pad) => Math.hypot(x - pad.x, z - pad.z) > pad.r + r + 4,
          ) &&
          props.every(
            (prop) => Math.hypot(x - prop.x, z - prop.z) > prop.r + r + 2.5,
          ) &&
          flora.every(
            (other) => Math.hypot(x - other.x, z - other.z) > other.r + r + 1.2,
          );
        if (!clear) continue;
        flora.push({
          kind,
          sector: id,
          x,
          z,
          r,
          scale: between(0.8, 1.25),
          rotation: next() * Math.PI * 2,
          solid,
        });
        placed++;
      }
    }
  }
  return flora;
}

export const flora = grow(2027);

export const arena: Arena = {
  radius: platformRadius,
  obstacles: [...props, ...flora.filter((item) => item.solid)],
  pads,
};

export const spawn = { x: 0, z: 0, heading: 0 };
