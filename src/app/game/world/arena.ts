import { sectionIds, type SectionId } from '@/src/content/sections';
import type { Arena, Obstacle, Pad } from '../physics';

// The platform the ships fly over: a round deck floating in space, with a
// landing pad for each section of the site around its edge and props in
// between to fly around. The props are placed by a fixed random sequence,
// so the arena is the same on every visit.

export const platformRadius = 110;
export const padRadius = 9;
const padRing = 70;

export interface LandingPad extends Pad {
  id: SectionId;
  angle: number;
}

// The first pad lies straight ahead of where the ships start.
export const pads: LandingPad[] = sectionIds.map((id, index) => {
  const angle = (index / sectionIds.length) * Math.PI * 2;
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
    const prop: Prop = {
      kind,
      r,
      height,
      rotation: next() * Math.PI,
      x: Math.sin(angle) * distance,
      z: Math.cos(angle) * distance,
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

export const arena: Arena = {
  radius: platformRadius,
  obstacles: props,
  pads,
};

export const spawn = { x: 0, z: 0, heading: 0 };
