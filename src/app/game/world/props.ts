import type { SectionId } from '@/src/content/sections';
import { buildXWing } from '../ships/xwing';
import {
  padRadius,
  type Flora,
  type FloraKind,
  type Landmark,
  type LandingPad,
  type Prop,
  type PropKind,
} from './arena';
import type { Builder, Vec } from './builder';

// What the props and the plants of each sector look like. A prop keeps
// the circle it takes on the ground, which the physics knows, whatever
// the sector dresses it as. Everything stands on a footing that goes a
// little under the ground, so the dunes and the drifts never show a gap.

export interface Context {
  // Where the lights that pulse go, like the tops of the masts.
  beacons: Vec[];
}

type PropBuilder = (b: Builder, prop: Prop, context: Context) => void;
type FloraBuilder = (b: Builder, item: Flora) => void;

const foot = -0.6;
const yawed = (
  prop: { x: number; z: number; rotation: number },
  forward: number,
  side = 0,
): Vec => [
  prop.x + Math.sin(prop.rotation) * forward + Math.cos(prop.rotation) * side,
  0,
  prop.z + Math.cos(prop.rotation) * forward - Math.sin(prop.rotation) * side,
];
const lift = (at: Vec, y: number): Vec => [at[0], y, at[2]];

// ─── Tatooine: the desert ──────────────────────────────────
const sand = '#d8b98c';
const sandDark = '#b8925e';
const rust = '#8a5a3a';
const steel = '#bfc3c7';
const steelDark = '#8d9196';
const warmGlow = '#ffd9a0';

const tatooine: Record<PropKind, PropBuilder> = {
  crate: (b, p) => {
    const yaw: Vec = [0, p.rotation, 0];
    if (p.r > 2.05) {
      // A sandcrawler, the Jawas' rolling scrapyard.
      const w = p.r * 1.3;
      const h = p.height * 1.15;
      const l = p.r * 2.3;
      b.box([w, h, l], rust, [p.x, h / 2 + 0.7, p.z], yaw);
      b.box([w * 1.04, 0.9, l * 0.92], '#3b2a1f', [p.x, 0.45, p.z], yaw);
      b.box([w, h * 0.7, 1.4], '#9a6a44', lift(yawed(p, l / 2), h * 0.45), [
        0.55,
        p.rotation,
        0,
      ]);
      b.box(
        [0.5, 0.3, 0.3],
        warmGlow,
        lift(yawed(p, l / 2 + 0.6, 0.8), h * 0.75),
        yaw,
        true,
      );
      b.box(
        [0.5, 0.3, 0.3],
        warmGlow,
        lift(yawed(p, l / 2 + 0.6, -0.8), h * 0.75),
        yaw,
        true,
      );
      b.cylinder(0.09, 0.12, 2.5, 5, steelDark, [p.x, h + 1.8, p.z]);
    } else {
      // A moisture farmer's homestead: a dome over a sunken yard.
      b.cylinder(p.r * 1.15, p.r * 1.25, 1.4, 10, sand, [
        p.x,
        0.7 + foot / 2,
        p.z,
      ]);
      b.sphere(p.r * 1.05, 10, sand, [p.x, 1.4, p.z], [1, 0.62, 1]);
      b.box([0.9, 1.2, 0.5], '#2a1a10', lift(yawed(p, p.r * 1.0), 0.6), yaw);
      b.box(
        [0.5, 0.35, 0.2],
        warmGlow,
        lift(yawed(p, p.r * 1.12, 0.9), 1.2),
        yaw,
        true,
      );
      b.cylinder(0.08, 0.08, 2.4, 5, steelDark, [p.x + 0.8, 2.6, p.z - 0.6]);
    }
  },
  pillar: (b, p) => {
    // A moisture vaporator: a slim tower of rings.
    const r = p.r * 0.42;
    b.box(
      [p.r * 1.6, 0.8, p.r * 1.6],
      sandDark,
      [p.x, 0.4 + foot / 2, p.z],
      [0, p.rotation, 0],
    );
    b.cylinder(r * 0.8, r, p.height, 8, steel, [p.x, p.height / 2, p.z]);
    for (let i = 1; i <= 3; i++) {
      b.cylinder(r * 1.6, r * 1.6, 0.25, 8, steelDark, [
        p.x,
        (p.height * i) / 3.4,
        p.z,
      ]);
    }
    b.cone(r * 1.1, 1.2, 8, steel, [p.x, p.height + 0.6, p.z]);
  },
  mast: (b, p, context) => {
    // A comm antenna beside a dish, with its lamp on top.
    b.box(
      [1.6, 0.8, 1.6],
      sandDark,
      [p.x, 0.4 + foot / 2, p.z],
      [0, p.rotation, 0],
    );
    b.cylinder(0.16, 0.28, p.height, 6, steel, [p.x, p.height / 2, p.z]);
    b.box(
      [2.2, 0.12, 0.12],
      steelDark,
      [p.x, p.height * 0.75, p.z],
      [0, p.rotation, 0],
    );
    b.box(
      [0.12, 0.12, 2.2],
      steelDark,
      [p.x, p.height * 0.75, p.z],
      [0, p.rotation, 0],
    );
    b.cylinder(
      1.3,
      1.3,
      0.2,
      10,
      steel,
      [p.x, p.height * 0.5, p.z],
      [0.9, p.rotation, 0],
    );
    context.beacons.push([p.x, p.height + 0.3, p.z]);
  },
  rock: (b, p) => {
    b.rock(
      p.r,
      '#c9a26e',
      [p.x, p.r * 0.5, p.z],
      [p.rotation * 0.3, p.rotation, 0],
    );
    b.rock(
      p.r * 0.55,
      '#b08c5a',
      [p.x + p.r * 0.9, p.r * 0.25, p.z + p.r * 0.5],
      [0, p.rotation * 2, 0.3],
    );
  },
};

// ─── Coruscant: the city planet ────────────────────────────
const tower = '#2e3350';
const towerLight = '#3a3f63';
const windowLight = '#9bd4ff';
const neon = '#ff6bd6';
const amber = '#ffb86b';

const coruscant: Record<PropKind, PropBuilder> = {
  crate: (b, p) => {
    // A block of the city: a tower with lit floors and a roof plant.
    const w = p.r * 1.55;
    const h = p.height * 2.6;
    const yaw: Vec = [0, p.rotation, 0];
    b.box([w, h - foot, w], tower, [p.x, (h + foot) / 2, p.z], yaw);
    for (let y = 1.6; y < h - 1; y += 2.1) {
      b.box(
        [w + 0.08, 0.28, w + 0.08],
        y % 4.2 < 2.1 ? windowLight : amber,
        [p.x, y, p.z],
        yaw,
        true,
      );
    }
    b.box([w * 0.5, 0.8, w * 0.5], towerLight, [p.x, h + 0.4, p.z], yaw);
    b.cylinder(0.07, 0.1, 2.4, 4, steelDark, [p.x, h + 1.8, p.z]);
  },
  pillar: (b, p) => {
    // A slim spire, ringed by light.
    const h = p.height * 1.9;
    b.cylinder(p.r * 0.7, p.r * 0.95, h - foot, 8, towerLight, [
      p.x,
      (h + foot) / 2,
      p.z,
    ]);
    for (let y = 2; y < h - 2; y += 3) {
      // A little wider than the spire at that height, so it stands out.
      const radius = p.r * (0.95 - (0.25 * (y - foot)) / (h - foot)) + 0.06;
      b.cylinder(
        radius,
        radius,
        0.22,
        8,
        amber,
        [p.x, y, p.z],
        undefined,
        true,
      );
    }
    b.cone(p.r * 0.7, 2.2, 8, tower, [p.x, h + 1.1, p.z]);
  },
  mast: (b, p, context) => {
    // An antenna spire over the traffic lanes.
    const h = p.height * 1.4;
    b.cylinder(p.r * 1.4, p.r * 1.8, 1.2, 8, towerLight, [
      p.x,
      0.6 + foot / 2,
      p.z,
    ]);
    b.cylinder(0.14, 0.3, h, 6, steel, [p.x, h / 2, p.z]);
    b.ring(
      0.9,
      0.08,
      windowLight,
      [p.x, h * 0.66, p.z],
      [Math.PI / 2, 0, 0],
      true,
    );
    context.beacons.push([p.x, h + 0.3, p.z]);
  },
  rock: (b, p) => {
    // A landing platform on a stalk, with its edge lit.
    b.cylinder(p.r * 0.35, p.r * 0.5, 2.4, 8, towerLight, [
      p.x,
      1.2 + foot / 2,
      p.z,
    ]);
    b.cylinder(p.r * 1.1, p.r * 1.0, 0.5, 12, tower, [p.x, 2.6, p.z]);
    b.ring(p.r * 1.02, 0.07, neon, [p.x, 2.96, p.z], [Math.PI / 2, 0, 0], true);
  },
};

// ─── Dagobah: the swamp ────────────────────────────────────
const bark = '#4b3b2a';
const barkDark = '#3a2c1e';
const moss = '#2f4a2a';
const mossLight = '#3d5a33';
const mushroomGlow = '#6ff5c8';

function swampTree(
  b: Builder,
  x: number,
  z: number,
  height: number,
  r: number,
  yaw: number,
) {
  const lean = 0.18;
  b.cylinder(
    r * 0.6,
    r * 0.9,
    height * 0.55 - foot,
    7,
    bark,
    [x, (height * 0.55 + foot) / 2, z],
    [lean, yaw, 0],
  );
  const top: Vec = [
    x - Math.sin(yaw) * lean * height * 0.5,
    height * 0.52,
    z - Math.cos(yaw) * lean * height * 0.5,
  ];
  b.cylinder(
    r * 0.35,
    r * 0.6,
    height * 0.5,
    7,
    barkDark,
    [top[0], top[1] + height * 0.22, top[2]],
    [-lean * 1.4, yaw, 0],
  );
  b.sphere(r * 2.6, 7, moss, [top[0], height * 0.95, top[2]], [1.3, 0.55, 1]);
  b.sphere(
    r * 1.9,
    7,
    mossLight,
    [top[0] + r, height * 1.05, top[2] - r * 0.5],
    [1.1, 0.5, 1],
  );
  for (let i = 0; i < 4; i++) {
    const a = yaw + (i / 4) * Math.PI * 2;
    b.cylinder(
      r * 0.18,
      r * 0.35,
      r * 2.2,
      5,
      bark,
      [x + Math.sin(a) * r * 0.9, 0.4, z + Math.cos(a) * r * 0.9],
      [0, a, 1.1],
    );
  }
}

const dagobah: Record<PropKind, PropBuilder> = {
  crate: (b, p) => {
    const yaw: Vec = [0, p.rotation, 0];
    if (p.r > 2.05) {
      // A cluster of stumps and a fallen trunk.
      b.cylinder(p.r * 0.5, p.r * 0.6, 1.6 - foot, 7, bark, [
        p.x,
        (1.6 + foot) / 2,
        p.z,
      ]);
      b.cylinder(p.r * 0.35, p.r * 0.45, 2.4 - foot, 7, barkDark, [
        p.x + p.r * 0.8,
        (2.4 + foot) / 2,
        p.z - p.r * 0.5,
      ]);
      b.cylinder(
        0.4,
        0.5,
        p.r * 2.4,
        6,
        bark,
        lift(yawed(p, 0, -p.r * 0.9), 0.4),
        [0, p.rotation, Math.PI / 2],
      );
    } else {
      // The master's hut: a low dome of mud, with a window glowing.
      b.sphere(p.r * 1.15, 9, '#6b5a3c', [p.x, 0.5, p.z], [1, 0.62, 1]);
      b.cylinder(0.5, 0.5, 0.9, 6, '#5a4a30', [p.x, 1.4, p.z]);
      b.box([0.8, 0.9, 0.4], '#2a1a10', lift(yawed(p, p.r * 1.05), 0.55), yaw);
      b.sphere(0.28, 6, amber, lift(yawed(p, p.r * 1.0, 0.9), 0.9), 1, true);
    }
  },
  pillar: (b, p) => swampTree(b, p.x, p.z, p.height * 1.1, p.r, p.rotation),
  mast: (b, p) => {
    // A giant of the swamp, with moss hanging from its crown.
    swampTree(b, p.x, p.z, p.height, p.r * 2.2, p.rotation);
    for (let i = 0; i < 4; i++) {
      const a = p.rotation + i * 1.7;
      b.cylinder(0.08, 0.12, 3.2, 4, '#6a8a4a', [
        p.x + Math.sin(a) * 2.6,
        p.height * 0.85,
        p.z + Math.cos(a) * 2.6,
      ]);
    }
  },
  rock: (b, p) => {
    b.rock(
      p.r,
      '#4a5a44',
      [p.x, p.r * 0.45, p.z],
      [p.rotation * 0.3, p.rotation, 0],
    );
    b.sphere(p.r * 0.8, 6, '#5c7a4a', [p.x, p.r * 0.95, p.z], [1.1, 0.4, 1]);
  },
};

// ─── Kamino: the ocean world ───────────────────────────────
const stilt = '#8a93a0';
const shell = '#d8dde3';
const shellLight = '#eef2f5';
const coldGlow = '#9ad8ff';

const kamino: Record<PropKind, PropBuilder> = {
  crate: (b, p) => {
    // A hall of the cloners, on a stalk over the sea.
    const deck = 3.2;
    b.cylinder(p.r * 0.45, p.r * 0.7, deck - foot, 8, stilt, [
      p.x,
      (deck + foot) / 2,
      p.z,
    ]);
    b.cylinder(p.r * 1.5, p.r * 1.3, 0.5, 14, shell, [p.x, deck, p.z]);
    b.sphere(p.r * 0.95, 10, shellLight, [p.x, deck + 0.3, p.z], [1, 0.62, 1]);
    b.ring(
      p.r * 0.98,
      0.09,
      coldGlow,
      [p.x, deck + 0.45, p.z],
      [Math.PI / 2, 0, 0],
      true,
    );
    b.cylinder(0.07, 0.1, 1.8, 4, stilt, [p.x, deck + 1.6, p.z]);
  },
  pillar: (b, p) => {
    // A pod on a tall stilt.
    b.cylinder(p.r * 0.45, p.r * 0.6, p.height - foot, 8, stilt, [
      p.x,
      (p.height + foot) / 2,
      p.z,
    ]);
    b.sphere(p.r * 1.3, 9, shell, [p.x, p.height + 0.4, p.z], [1, 0.7, 1]);
    b.ring(
      p.r * 1.3,
      0.08,
      coldGlow,
      [p.x, p.height + 0.1, p.z],
      [Math.PI / 2, 0, 0],
      true,
    );
  },
  mast: (b, p, context) => {
    // A lightning tower.
    b.cylinder(0.9, 1.3, 1 - foot, 8, stilt, [p.x, (1 + foot) / 2, p.z]);
    b.cylinder(0.12, 0.26, p.height, 6, shell, [p.x, p.height / 2, p.z]);
    b.sphere(0.6, 7, shell, [p.x, p.height * 0.8, p.z]);
    context.beacons.push([p.x, p.height + 0.3, p.z]);
  },
  rock: (b, p) => {
    // A rock in the waves, ringed with foam.
    b.rock(
      p.r,
      '#2f3a44',
      [p.x, p.r * 0.3, p.z],
      [p.rotation * 0.3, p.rotation, 0],
    );
    b.ring(
      p.r * 1.25,
      0.12,
      '#cfe8ff',
      [p.x, 0.16, p.z],
      [Math.PI / 2, 0, 0],
      true,
    );
  },
};

// ─── Naboo: the green world ────────────────────────────────
const stone = '#d9c9a5';
const stoneLight = '#e2d6b8';
const copper = '#5faa7a';
const lantern = '#ffe3a0';

const naboo: Record<PropKind, PropBuilder> = {
  crate: (b, p) => {
    // A house of the capital: sandstone, arches and a green dome.
    const w = p.r * 1.75;
    const h = p.height * 0.85;
    const yaw: Vec = [0, p.rotation, 0];
    b.box([w, h - foot, w], stone, [p.x, (h + foot) / 2, p.z], yaw);
    b.box([w * 1.15, 0.35, w * 1.15], stoneLight, [p.x, 0.15, p.z], yaw);
    b.sphere(p.r * 0.9, 10, copper, [p.x, h + 0.1, p.z], [1, 0.72, 1]);
    for (const side of [-0.55, 0, 0.55]) {
      b.box(
        [0.45, 0.9, 0.2],
        lantern,
        lift(yawed(p, w / 2 + 0.02, side * w), h * 0.45),
        yaw,
        true,
      );
    }
  },
  pillar: (b, p) => {
    // A column with a lantern on top.
    b.box(
      [p.r * 1.6, 0.6, p.r * 1.6],
      stoneLight,
      [p.x, 0.3 + foot / 2, p.z],
      [0, p.rotation, 0],
    );
    b.cylinder(p.r * 0.45, p.r * 0.55, p.height, 10, stoneLight, [
      p.x,
      p.height / 2,
      p.z,
    ]);
    b.box(
      [p.r * 1.3, 0.4, p.r * 1.3],
      stone,
      [p.x, p.height + 0.2, p.z],
      [0, p.rotation, 0],
    );
    b.sphere(0.4, 7, lantern, [p.x, p.height + 0.85, p.z], 1, true);
  },
  mast: (b, p) => {
    // A bell tower with a green dome.
    const r = p.r * 2.4;
    b.cylinder(r, r * 1.15, p.height - foot, 10, stone, [
      p.x,
      (p.height + foot) / 2,
      p.z,
    ]);
    b.cylinder(r * 1.1, r * 1.1, 0.5, 10, stoneLight, [
      p.x,
      p.height * 0.8,
      p.z,
    ]);
    b.cylinder(
      r * 1.08,
      r * 1.08,
      0.5,
      10,
      lantern,
      [p.x, p.height * 0.9, p.z],
      undefined,
      true,
    );
    b.sphere(r * 1.05, 10, copper, [p.x, p.height + 0.1, p.z], [1, 0.8, 1]);
    b.cylinder(0.07, 0.1, 1.6, 4, stoneLight, [p.x, p.height + 1.6, p.z]);
  },
  rock: (b, p) => {
    b.rock(
      p.r,
      '#7f8f6a',
      [p.x, p.r * 0.45, p.z],
      [p.rotation * 0.3, p.rotation, 0],
    );
    b.sphere(0.22, 5, '#ff8fb0', [p.x + p.r * 0.9, 0.2, p.z + p.r * 0.4]);
    b.sphere(0.2, 5, '#fff1a0', [p.x - p.r * 0.7, 0.18, p.z + p.r * 0.8]);
  },
};

// ─── Endor: the forest moon ────────────────────────────────
const redwood = '#5a3a22';
const needles = '#2d5a2e';
const needlesLight = '#3a6e36';
const hut = '#8a6a46';
const thatch = '#6a4a2a';

function tallTree(
  b: Builder,
  x: number,
  z: number,
  height: number,
  r: number,
  yaw: number,
) {
  b.cylinder(
    r * 0.7,
    r * 1.0,
    height * 0.75 - foot,
    7,
    redwood,
    [x, (height * 0.75 + foot) / 2, z],
    [0, yaw, 0],
  );
  b.cone(r * 3.2, height * 0.4, 7, needles, [x, height * 0.72, z], [0, yaw, 0]);
  b.cone(
    r * 2.5,
    height * 0.34,
    7,
    needlesLight,
    [x, height * 0.92, z],
    [0, yaw + 0.4, 0],
  );
  b.cone(r * 1.6, height * 0.26, 7, needles, [x, height * 1.1, z], [0, yaw, 0]);
}

const endor: Record<PropKind, PropBuilder> = {
  crate: (b, p) => {
    const yaw: Vec = [0, p.rotation, 0];
    if (p.r > 2.05) {
      // The bunker in the hillside.
      b.sphere(p.r * 1.5, 9, '#3e5a34', [p.x, 0.2, p.z], [1.2, 0.5, 1]);
      b.box(
        [p.r * 1.5, p.height * 0.75, p.r * 1.1],
        '#6a6e70',
        [p.x, p.height * 0.35, p.z],
        yaw,
      );
      b.box(
        [p.r * 0.7, p.height * 0.55, 0.3],
        '#2a2e33',
        lift(yawed(p, p.r * 0.55), p.height * 0.28),
        yaw,
      );
    } else {
      // A village hut on stilts, in the trees.
      const floor = 2.4;
      for (let i = 0; i < 3; i++) {
        const a = p.rotation + (i / 3) * Math.PI * 2;
        b.cylinder(0.12, 0.16, floor - foot, 5, redwood, [
          p.x + Math.sin(a) * p.r * 0.7,
          (floor + foot) / 2,
          p.z + Math.cos(a) * p.r * 0.7,
        ]);
      }
      b.cylinder(p.r * 1.0, p.r * 1.0, 0.25, 8, redwood, [p.x, floor, p.z]);
      b.cylinder(p.r * 0.85, p.r * 0.9, 1.3, 8, hut, [p.x, floor + 0.75, p.z]);
      b.cone(p.r * 1.15, 1.4, 8, thatch, [p.x, floor + 2.1, p.z]);
      b.box(
        [0.5, 0.45, 0.2],
        amber,
        lift(yawed(p, p.r * 0.88), floor + 0.8),
        yaw,
        true,
      );
    }
  },
  pillar: (b, p) => tallTree(b, p.x, p.z, p.height * 1.7, p.r, p.rotation),
  mast: (b, p) => {
    // A giant tree with a platform of the village around its trunk.
    const height = p.height * 1.3;
    tallTree(b, p.x, p.z, height, p.r * 2.4, p.rotation);
    b.ring(p.r * 3.4, 0.35, hut, [p.x, height * 0.5, p.z], [Math.PI / 2, 0, 0]);
    b.cylinder(0.7, 0.75, 1.1, 7, hut, [
      p.x + p.r * 3.4,
      height * 0.5 + 0.7,
      p.z,
    ]);
    b.cone(0.95, 1.0, 7, thatch, [p.x + p.r * 3.4, height * 0.5 + 1.7, p.z]);
  },
  rock: (b, p) => {
    b.rock(
      p.r,
      '#55684a',
      [p.x, p.r * 0.45, p.z],
      [p.rotation * 0.3, p.rotation, 0],
    );
    b.cone(
      0.5,
      0.9,
      5,
      needlesLight,
      [p.x + p.r * 0.9, 0.45, p.z],
      [0.4, 0, 0.5],
    );
  },
};

// ─── Hoth: the ice world ───────────────────────────────────
const snow = '#e8f0f7';
const ice = '#cfe6f7';
const iceDeep = '#b9d8ee';

const hoth: Record<PropKind, PropBuilder> = {
  crate: (b, p) => {
    const yaw: Vec = [0, p.rotation, 0];
    if (p.r > 2.05) {
      // The hangar mound of the hidden base, its mouth lit.
      b.sphere(p.r * 1.6, 10, snow, [p.x, 0.2, p.z], [1.4, 0.6, 1]);
      b.box(
        [p.r * 1.3, p.height * 0.6, 0.5],
        '#2a3340',
        lift(yawed(p, p.r * 1.25), p.height * 0.3),
        yaw,
      );
      b.box(
        [p.r * 1.1, 0.18, 0.2],
        warmGlow,
        lift(yawed(p, p.r * 1.3), p.height * 0.62),
        yaw,
        true,
      );
    } else {
      // A door into the snow, with its beacon strip.
      b.sphere(p.r * 1.4, 9, snow, [p.x, 0.1, p.z], [1, 0.65, 1]);
      b.box([1.2, 1.5, 0.4], '#2a3340', lift(yawed(p, p.r * 1.1), 0.75), yaw);
      b.box(
        [0.15, 1.5, 0.12],
        coldGlow,
        lift(yawed(p, p.r * 1.12, 0.8), 0.75),
        yaw,
        true,
      );
    }
  },
  pillar: (b, p) => {
    // A spire of ice.
    b.cone(
      p.r * 0.9,
      p.height - foot,
      6,
      ice,
      [p.x, (p.height + foot) / 2, p.z],
      [0.08, p.rotation, 0],
    );
    b.cone(
      p.r * 0.55,
      p.height * 0.55,
      5,
      iceDeep,
      [p.x + p.r * 0.8, p.height * 0.25, p.z - p.r * 0.4],
      [-0.15, p.rotation, 0.1],
    );
  },
  mast: (b, p, context) => {
    // A transmitter: a lattice mast with its dish turned to the sky.
    b.box(
      [1.8, 0.8, 1.8],
      '#aab8c6',
      [p.x, 0.4 + foot / 2, p.z],
      [0, p.rotation, 0],
    );
    b.cylinder(0.16, 0.3, p.height, 6, steelDark, [p.x, p.height / 2, p.z]);
    b.cylinder(
      1.6,
      1.6,
      0.25,
      12,
      shell,
      [p.x, p.height * 0.7, p.z],
      [0.8, p.rotation, 0],
    );
    b.cylinder(
      0.06,
      0.06,
      1.2,
      4,
      steelDark,
      [p.x, p.height * 0.7 + 0.6, p.z],
      [0.8, p.rotation, 0],
    );
    context.beacons.push([p.x, p.height + 0.3, p.z]);
  },
  rock: (b, p) => {
    b.rock(
      p.r,
      '#dbe9f5',
      [p.x, p.r * 0.45, p.z],
      [p.rotation * 0.3, p.rotation, 0],
    );
    b.sphere(p.r * 0.7, 6, '#ffffff', [p.x, p.r * 0.95, p.z], [1.1, 0.35, 1]);
  },
};

export const propBuilders: Record<SectionId, Record<PropKind, PropBuilder>> = {
  about: tatooine,
  experience: coruscant,
  education: dagobah,
  courses: kamino,
  projects: naboo,
  contributing: endor,
  contact: hoth,
};

// ─── Plants, and what stands among them ─────────────────────
export const floraBuilders: Record<FloraKind, FloraBuilder> = {
  shrub: (b, f) => {
    b.sphere(0.7 * f.scale, 6, '#6b6a3a', [f.x, 0.3, f.z], [1.2, 0.6, 1]);
    b.sphere(
      0.45 * f.scale,
      5,
      '#7d7a44',
      [f.x + 0.6, 0.25, f.z - 0.3],
      [1, 0.6, 1],
    );
  },
  bones: (b, f) => {
    // The bones of a krayt dragon, bleached by the suns.
    const bone = '#e9e2d0';
    b.sphere(1.3 * f.scale, 8, bone, lift(yawed(f, -2.2), 0.7), [1.7, 0.9, 1]);
    for (let i = 0; i < 5; i++) {
      const radius = (2.0 - i * 0.25) * f.scale;
      b.ring(
        radius,
        0.1,
        bone,
        lift(yawed(f, i * 1.3), 0.2),
        [0, f.rotation + Math.PI / 2, 0],
        false,
        Math.PI,
      );
    }
  },
  lamp: (b, f) => {
    b.cylinder(0.07, 0.1, 2.6, 5, steelDark, [f.x, 1.3, f.z]);
    b.sphere(0.26, 6, '#ffe9b0', [f.x, 2.75, f.z], 1, true);
  },
  billboard: (b, f) => {
    const color = f.rotation > Math.PI ? neon : '#4ff0ff';
    b.cylinder(0.1, 0.14, 3.6, 5, steelDark, [f.x, 1.8, f.z]);
    b.box(
      [2.4 * f.scale, 1.3 * f.scale, 0.1],
      color,
      [f.x, 4.2, f.z],
      [0, f.rotation, 0],
      true,
    );
    b.box(
      [2.5 * f.scale, 1.4 * f.scale, 0.08],
      tower,
      [f.x, 4.2, f.z],
      [0, f.rotation, 0],
    );
  },
  mushroom: (b, f) => {
    const s = f.scale;
    b.cylinder(0.1 * s, 0.14 * s, 0.6 * s, 5, '#d8d2c0', [f.x, 0.3 * s, f.z]);
    b.sphere(0.4 * s, 7, mushroomGlow, [f.x, 0.6 * s, f.z], [1, 0.5, 1], true);
    b.cylinder(0.07, 0.1, 0.4, 5, '#d8d2c0', [f.x + 0.5, 0.2, f.z + 0.2]);
    b.sphere(
      0.24,
      6,
      mushroomGlow,
      [f.x + 0.5, 0.4, f.z + 0.2],
      [1, 0.5, 1],
      true,
    );
  },
  reed: (b, f) => {
    for (let i = 0; i < 3; i++) {
      const a = f.rotation + i * 2.1;
      b.cylinder(
        0.05,
        0.08,
        1.8 * f.scale,
        4,
        '#6a7a3a',
        [f.x + Math.sin(a) * 0.3, 0.9 * f.scale, f.z + Math.cos(a) * 0.3],
        [0.12, a, 0],
      );
    }
  },
  wreck: (b, f) => {
    // A starfighter sunk in the swamp, nose down, where its pilot left it.
    b.model(buildXWing(), [f.x, -0.6, f.z], [-0.35, f.rotation, 0.3], 1.3);
  },
  tree: (b, f) => {
    const s = f.scale;
    b.cylinder(0.22 * s, 0.4 * s, 2.4 * s - foot, 6, '#6b4a2e', [
      f.x,
      (2.4 * s + foot) / 2,
      f.z,
    ]);
    b.sphere(1.7 * s, 8, '#3f9a4a', [f.x, 3.1 * s, f.z], [1, 0.85, 1]);
    b.sphere(1.2 * s, 7, '#58b85c', [f.x + 0.9 * s, 3.6 * s, f.z - 0.4 * s]);
  },
  flowers: (b, f) => {
    const colors = ['#ff8fb0', '#fff1a0', '#ffffff', '#d9a0ff'];
    for (let i = 0; i < 6; i++) {
      const a = f.rotation + i * 1.05;
      const d = 0.3 + (i % 3) * 0.3;
      b.sphere(0.13, 4, colors[i % colors.length], [
        f.x + Math.sin(a) * d,
        0.18,
        f.z + Math.cos(a) * d,
      ]);
    }
  },
  redwood: (b, f) =>
    tallTree(b, f.x, f.z, (12 + f.scale * 6) * 1.0, f.r * 0.9, f.rotation),
  fern: (b, f) => {
    for (let i = 0; i < 5; i++) {
      const a = f.rotation + (i / 5) * Math.PI * 2;
      b.cone(
        0.18 * f.scale,
        1.0 * f.scale,
        4,
        '#3f7a3a',
        [f.x + Math.sin(a) * 0.35, 0.45 * f.scale, f.z + Math.cos(a) * 0.35],
        [0.55, a, 0],
      );
    }
  },
  crystal: (b, f) => {
    for (let i = 0; i < 4; i++) {
      const a = f.rotation + i * 1.6;
      b.cone(
        0.22 * f.scale,
        (1.2 + (i % 2) * 0.8) * f.scale,
        5,
        i % 2 ? ice : '#e4f3ff',
        [f.x + Math.sin(a) * 0.4, 0.5 * f.scale, f.z + Math.cos(a) * 0.4],
        [0.3, a, 0],
      );
    }
  },
};

// ─── The landing places ─────────────────────────────────────
// Each pad is a place of its planet: its ground, what stands around its
// rim (low, so the ship passes over it) and, outward from the middle, the
// landmark beside it, which is solid.

type PadBuilder = (b: Builder, pad: LandingPad) => void;
type LandmarkBuilder = (b: Builder, mark: Landmark) => void;

// Places things around the rim of a pad.
function around(
  pad: LandingPad,
  count: number,
  distance: number,
  place: (x: number, z: number, angle: number, index: number) => void,
  offset = 0,
) {
  for (let i = 0; i < count; i++) {
    const angle = pad.angle + offset + (i / count) * Math.PI * 2;
    place(
      pad.x + Math.sin(angle) * distance,
      pad.z - Math.cos(angle) * distance,
      angle,
      i,
    );
  }
}

function disc(b: Builder, pad: LandingPad, color: string, inner?: string) {
  b.cylinder(padRadius, padRadius + 0.4, 0.3, 48, color, [pad.x, 0.15, pad.z]);
  if (inner) {
    b.cylinder(padRadius * 0.55, padRadius * 0.55, 0.32, 48, inner, [
      pad.x,
      0.16,
      pad.z,
    ]);
  }
}

function lanternPost(b: Builder, x: number, z: number, glow: string) {
  b.cylinder(0.07, 0.09, 0.8, 5, steelDark, [x, 0.4, z]);
  b.sphere(0.2, 6, glow, [x, 0.95, z], 1, true);
}

export const padBuilders: Record<SectionId, PadBuilder> = {
  about: (b, pad) => {
    // A courtyard of packed sand, ringed by stones and lanterns.
    disc(b, pad, '#c9a56e', '#b48f5c');
    around(pad, 10, 11, (x, z, angle, i) => {
      b.rock(
        0.55 + (i % 3) * 0.15,
        i % 2 ? sandDark : '#c9a26e',
        [x, 0.3, z],
        [0, angle, 0.2],
      );
    });
    around(pad, 4, 11.5, (x, z) => lanternPost(b, x, z, warmGlow), Math.PI / 4);
  },
  experience: (b, pad) => {
    // A rooftop platform, its edge lit, with light pylons.
    disc(b, pad, '#2a2f4a', '#353b5e');
    around(pad, 16, 10.6, (x, z, angle) => {
      b.box([1.1, 0.22, 0.3], windowLight, [x, 0.4, z], [0, angle, 0], true);
    });
    around(
      pad,
      4,
      11.8,
      (x, z) => {
        b.cylinder(0.1, 0.14, 1.1, 5, towerLight, [x, 0.55, z]);
        b.box([0.5, 0.2, 0.5], neon, [x, 1.2, z], undefined, true);
      },
      Math.PI / 4,
    );
  },
  education: (b, pad) => {
    // A mossy clearing, with logs and glowing mushrooms around it.
    disc(b, pad, '#2f3f2a', '#3a4d33');
    around(pad, 6, 11.2, (x, z, angle) => {
      b.cylinder(
        0.3,
        0.35,
        2.2,
        6,
        bark,
        [x, 0.3, z],
        [0, angle + Math.PI / 2, Math.PI / 2],
      );
    });
    around(
      pad,
      8,
      11.4,
      (x, z) => {
        b.cylinder(0.09, 0.12, 0.5, 5, '#d8d2c0', [x, 0.25, z]);
        b.sphere(0.32, 7, mushroomGlow, [x, 0.5, z], [1, 0.5, 1], true);
      },
      Math.PI / 8,
    );
  },
  courses: (b, pad) => {
    // A platform of the cloners, white over the sea, with bollards lit.
    disc(b, pad, '#dfe5ea', '#cfd7de');
    around(pad, 8, 11, (x, z) => {
      b.cylinder(0.3, 0.36, 0.8, 7, shell, [x, 0.4, z]);
      b.sphere(0.2, 6, coldGlow, [x, 0.95, z], 1, true);
    });
  },
  projects: (b, pad) => {
    // A plaza of stone, with planters of flowers around it.
    disc(b, pad, '#d9c9a5', '#bfae86');
    b.cylinder(padRadius * 0.8, padRadius * 0.8, 0.31, 48, '#cdbb93', [
      pad.x,
      0.16,
      pad.z,
    ]);
    around(pad, 6, 11.3, (x, z, angle, i) => {
      b.box([1.6, 0.6, 0.7], stoneLight, [x, 0.3, z], [0, angle, 0]);
      b.sphere(0.5, 6, '#3f9a4a', [x, 0.75, z], [1.4, 0.6, 0.9]);
      b.sphere(0.14, 4, i % 2 ? '#ff8fb0' : '#fff1a0', [x + 0.3, 1.0, z]);
      b.sphere(0.14, 4, i % 2 ? '#fff1a0' : '#d9a0ff', [
        x - 0.3,
        0.95,
        z + 0.1,
      ]);
    });
  },
  contributing: (b, pad) => {
    // A deck of planks in the forest, lit by torches.
    disc(b, pad, '#6b4a2e', '#7a5636');
    b.cylinder(padRadius * 0.78, padRadius * 0.78, 0.31, 48, '#5f4229', [
      pad.x,
      0.16,
      pad.z,
    ]);
    around(pad, 8, 11.2, (x, z) => {
      b.cylinder(0.08, 0.1, 1.0, 5, bark, [x, 0.5, z]);
      b.cone(0.2, 0.5, 5, '#ffb347', [x, 1.25, z], undefined, true);
    });
  },
  contact: (b, pad) => {
    // A strip cleared in the snow, with marker lights and drifts around.
    disc(b, pad, '#e8f0f7', '#d6e2ed');
    around(pad, 12, 10.8, (x, z) => {
      b.box([0.45, 0.25, 0.45], coldGlow, [x, 0.42, z], undefined, true);
    });
    around(
      pad,
      5,
      12.2,
      (x, z) => {
        b.sphere(1.3, 7, snow, [x, 0.1, z], [1.6, 0.45, 1]);
      },
      0.3,
    );
  },
};

// Yaw that turns a landmark's front towards its pad.
const facing = (mark: Landmark) => -mark.angle;
const front = (mark: Landmark, forward: number, side = 0): Vec =>
  yawed({ x: mark.x, z: mark.z, rotation: facing(mark) }, forward, side);

export const landmarkBuilders: Record<SectionId, LandmarkBuilder> = {
  about: (b, mark) => {
    // A moisture farmer's homestead: the dome, its door to the pad, and a
    // vaporator beside it.
    const yaw: Vec = [0, facing(mark), 0];
    b.cylinder(3.4, 3.6, 1.6, 12, sand, [mark.x, 0.8 + foot / 2, mark.z]);
    b.sphere(3.3, 12, sand, [mark.x, 1.6, mark.z], [1, 0.6, 1]);
    b.box([1.4, 1.8, 0.8], '#2a1a10', lift(front(mark, 3.1), 0.9), yaw);
    b.box([1.6, 0.18, 0.3], warmGlow, lift(front(mark, 3.25), 1.95), yaw, true);
    for (const side of [-2.2, 2.2]) {
      b.box(
        [0.6, 0.4, 0.2],
        warmGlow,
        lift(front(mark, 3.0, side), 1.5),
        yaw,
        true,
      );
    }
    const [vx, , vz] = front(mark, -1, 4.6);
    b.cylinder(0.4, 0.5, 7, 8, steel, [vx, 3.5, vz]);
    for (let i = 1; i <= 3; i++) {
      b.cylinder(0.8, 0.8, 0.25, 8, steelDark, [vx, i * 2, vz]);
    }
  },
  experience: (b, mark) => {
    // A pylon with the district's holo-sign, over the platform.
    const yaw: Vec = [0, facing(mark), 0];
    b.cylinder(1.6, 2.0, 1.2, 8, towerLight, [mark.x, 0.6 + foot / 2, mark.z]);
    b.cylinder(0.35, 0.5, 11, 8, tower, [mark.x, 5.5, mark.z]);
    b.box([4.2, 2.4, 0.16], neon, lift(front(mark, 0.4), 7.5), yaw, true);
    b.box([4.4, 2.6, 0.12], tower, lift(front(mark, 0.3), 7.5), yaw);
    b.box([2.6, 1.2, 0.16], '#4ff0ff', lift(front(mark, 0.4), 4.6), yaw, true);
    b.ring(
      1.1,
      0.08,
      windowLight,
      [mark.x, 11.2, mark.z],
      [Math.PI / 2, 0, 0],
      true,
    );
  },
  education: (b, mark) => {
    // The master's hut, its window lit, under a tree of the swamp.
    const yaw: Vec = [0, facing(mark), 0];
    b.sphere(2.9, 10, '#6b5a3c', [mark.x, 0.9, mark.z], [1, 0.62, 1]);
    b.cylinder(0.7, 0.8, 1.2, 7, '#5a4a30', [mark.x, 2.6, mark.z]);
    b.box([1.1, 1.3, 0.5], '#2a1a10', lift(front(mark, 2.6), 0.75), yaw);
    b.sphere(0.34, 6, amber, lift(front(mark, 2.5, 1.5), 1.3), 1, true);
    const [tx, , tz] = front(mark, -2.4, 3.2);
    swampTree(b, tx, tz, 9, 1.1, facing(mark) + 0.6);
  },
  courses: (b, mark) => {
    // A hall of the cloners: a white dome on its base, ringed with light.
    b.cylinder(4.2, 4.6, 2.4, 14, shell, [mark.x, 1.2 + foot / 2, mark.z]);
    b.sphere(3.9, 12, shellLight, [mark.x, 2.5, mark.z], [1, 0.62, 1]);
    b.ring(
      4.0,
      0.1,
      coldGlow,
      [mark.x, 2.55, mark.z],
      [Math.PI / 2, 0, 0],
      true,
    );
    b.box([1.2, 1.6, 0.4], '#2a3340', lift(front(mark, 4.2), 1.2), [
      0,
      facing(mark),
      0,
    ]);
    b.cylinder(0.07, 0.1, 3, 4, stilt, [mark.x, 6, mark.z]);
    b.sphere(0.25, 6, coldGlow, [mark.x, 7.6, mark.z], 1, true);
  },
  projects: (b, mark) => {
    // A palace of the capital: arches to the pad, columns and a green dome.
    const yaw: Vec = [0, facing(mark), 0];
    b.box([10, 0.4, 7], stoneLight, [mark.x, 0.2 + foot / 2, mark.z], yaw);
    b.box([8.5, 4.2, 5], stone, [mark.x, 2.1, mark.z], yaw);
    for (const side of [-2.6, 0, 2.6]) {
      b.box(
        [1.4, 2.6, 0.3],
        lantern,
        lift(front(mark, 2.55, side), 1.5),
        yaw,
        true,
      );
    }
    for (const side of [-4.0, 4.0]) {
      const [cx, , cz] = front(mark, 3.4, side);
      b.cylinder(0.35, 0.42, 4.4, 8, stoneLight, [cx, 2.2, cz]);
      b.box([1.0, 0.3, 1.0], stone, [cx, 4.5, cz], yaw);
    }
    b.box([9, 0.5, 5.5], stoneLight, [mark.x, 4.45, mark.z], yaw);
    b.sphere(3.0, 12, copper, [mark.x, 4.6, mark.z], [1, 0.7, 1]);
    b.cylinder(0.06, 0.08, 1.6, 4, stoneLight, [mark.x, 7.3, mark.z]);
  },
  contributing: (b, mark) => {
    // A village in the trees: huts on stilts, a bridge and torches.
    const yaw = facing(mark);
    const huts: [number, number, number, number][] = [
      [-2.6, 0.4, 1.7, 3.2],
      [2.8, -0.6, 1.4, 4.6],
    ];
    for (const [side, forward, r, floor] of huts) {
      const [hx, , hz] = front(mark, forward, side);
      for (let i = 0; i < 3; i++) {
        const a = yaw + (i / 3) * Math.PI * 2;
        b.cylinder(0.14, 0.18, floor - foot, 5, redwood, [
          hx + Math.sin(a) * r * 0.7,
          (floor + foot) / 2,
          hz + Math.cos(a) * r * 0.7,
        ]);
      }
      b.cylinder(r, r, 0.25, 8, redwood, [hx, floor, hz]);
      b.cylinder(r * 0.85, r * 0.9, 1.4, 8, hut, [hx, floor + 0.8, hz]);
      b.cone(r * 1.15, 1.5, 8, thatch, [hx, floor + 2.25, hz]);
      b.box(
        [0.5, 0.45, 0.2],
        amber,
        lift(yawed({ x: hx, z: hz, rotation: yaw }, r * 0.88), floor + 0.85),
        [0, yaw, 0],
        true,
      );
    }
    const [bx, , bz] = front(mark, -0.1, 0.1);
    b.box([4.6, 0.16, 0.9], redwood, [bx, 3.6, bz], [0, yaw + 0.25, 0.22]);
    for (const side of [-4.5, 4.5]) {
      const [tx, , tz] = front(mark, 3.2, side);
      b.cylinder(0.09, 0.11, 1.2, 5, bark, [tx, 0.6, tz]);
      b.cone(0.22, 0.55, 5, '#ffb347', [tx, 1.45, tz], undefined, true);
    }
  },
  contact: (b, mark) => {
    // The hangar of the hidden base, dug into the snow, its mouth lit.
    const yaw: Vec = [0, facing(mark), 0];
    b.sphere(4.8, 12, snow, [mark.x, 0.4, mark.z], [1.5, 0.62, 1]);
    b.box([4.6, 2.6, 0.8], '#2a3340', lift(front(mark, 4.0), 1.3), yaw);
    b.box([4.2, 0.2, 0.2], warmGlow, lift(front(mark, 4.2), 2.7), yaw, true);
    for (const side of [-2.6, 2.6]) {
      b.box(
        [0.3, 0.3, 0.3],
        coldGlow,
        lift(front(mark, 4.4, side), 0.5),
        yaw,
        true,
      );
    }
    b.cylinder(0.08, 0.1, 2.5, 4, steelDark, lift(front(mark, -2, 2.5), 3.2));
    b.cylinder(1.0, 1.0, 0.2, 10, shell, lift(front(mark, -2, 2.5), 4.4), [
      0.9,
      facing(mark),
      0,
    ]);
  },
};
