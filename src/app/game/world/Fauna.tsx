'use client';

// HOOKS
import { useRef } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { useReducedMotion } from '../useMediaQuery';
import { arena, pads, platformRadius } from './arena';
import { angleOf, hubRadius, sectorAngle, sectorAt } from './biomes';
import { Builder, litMaterial, solidMaterial, type Built } from './builder';
import { groundHeight } from './terrain';

// The animals of each sector, and the traffic of the city: each kind is
// one shape drawn many times, and each frame moves them a little. They
// wander their own sector, keep off the pads and the props, and stay
// still for whoever asks for less motion.

type Motion = 'walk' | 'hop' | 'orbit' | 'lane';

interface Species {
  sector: SectionId;
  count: number;
  motion: Motion;
  speed: number;
  scale: number;
  // Of the flyers.
  height: number;
  build: (b: Builder) => void;
}

const species: Species[] = [
  {
    // Banthas, shaggy and slow, in twos and threes.
    sector: 'about',
    count: 4,
    motion: 'walk',
    speed: 1.1,
    scale: 0.8,
    height: 0,
    build: (b) => {
      b.sphere(1.1, 8, '#6b4a30', [0, 1.5, 0], [1, 0.95, 1.5]);
      b.sphere(0.75, 7, '#7a5a3a', [0, 1.95, 0.1], [1.05, 0.7, 1.2]);
      b.sphere(0.55, 7, '#5a3c26', [0, 1.6, -1.6]);
      b.ring(
        0.5,
        0.08,
        '#d8c9a8',
        [0.55, 1.9, -1.6],
        [0, 0, 0.3],
        false,
        Math.PI * 1.3,
      );
      b.ring(
        0.5,
        0.08,
        '#d8c9a8',
        [-0.55, 1.9, -1.6],
        [0, 0, -0.3],
        false,
        Math.PI * 1.3,
      );
      for (const x of [-0.55, 0.55]) {
        for (const z of [-0.7, 0.7]) {
          b.cylinder(0.16, 0.2, 1.0, 5, '#5a3c26', [x, 0.5, z]);
        }
      }
    },
  },
  {
    // Speeders on the traffic lanes, high over the blocks.
    sector: 'experience',
    count: 8,
    motion: 'lane',
    speed: 14,
    scale: 0.8,
    height: 7,
    build: (b) => {
      b.box([0.9, 0.3, 2.0], '#3a3f63', [0, 0, 0]);
      b.sphere(0.3, 6, '#9ad8ff', [0, 0.22, -0.3], [1, 0.6, 1.4], true);
      b.box([0.8, 0.12, 0.1], '#ff5a5a', [0, 0.05, 1.02], undefined, true);
      b.box([0.26, 0.1, 0.1], '#ffe9b0', [0.3, 0, -1.02], undefined, true);
      b.box([0.26, 0.1, 0.1], '#ffe9b0', [-0.3, 0, -1.02], undefined, true);
    },
  },
  {
    // Frogs of the swamp, in short hops.
    sector: 'education',
    count: 8,
    motion: 'hop',
    speed: 1.6,
    scale: 1,
    height: 0,
    build: (b) => {
      b.sphere(0.35, 6, '#4f8a3a', [0, 0.3, 0], [1, 0.7, 1.2]);
      for (const x of [-0.18, 0.18]) {
        b.sphere(0.1, 5, '#e8ffb0', [x, 0.5, -0.25]);
        b.sphere(0.05, 4, '#1a1a1a', [x, 0.52, -0.33]);
      }
    },
  },
  {
    // Aiwhas gliding in circles over the sea.
    sector: 'courses',
    count: 3,
    motion: 'orbit',
    speed: 0.22,
    scale: 1.2,
    height: 13,
    build: (b) => {
      b.sphere(0.8, 8, '#6f8fa8', [0, 0, 0], [0.9, 0.6, 2.4]);
      b.box([2.8, 0.08, 1.0], '#8fb0c8', [1.5, 0, 0.2], [0, 0, 0.12]);
      b.box([2.8, 0.08, 1.0], '#8fb0c8', [-1.5, 0, 0.2], [0, 0, -0.12]);
      b.cone(0.3, 1.0, 5, '#6f8fa8', [0, 0, 2.3], [-Math.PI / 2, 0, 0]);
      b.sphere(0.5, 6, '#b8cfe0', [0, -0.25, -0.6], [1, 0.6, 1.4]);
    },
  },
  {
    // Shaaks grazing the meadows.
    sector: 'projects',
    count: 5,
    motion: 'walk',
    speed: 0.8,
    scale: 1,
    height: 0,
    build: (b) => {
      b.sphere(0.9, 8, '#a6a07a', [0, 1.0, 0], [1.2, 0.95, 1.1]);
      b.sphere(0.3, 6, '#9a9470', [0, 0.9, -1.1]);
      b.cone(0.08, 0.25, 4, '#9a9470', [0.18, 1.12, -1.1]);
      b.cone(0.08, 0.25, 4, '#9a9470', [-0.18, 1.12, -1.1]);
      for (const x of [-0.45, 0.45]) {
        for (const z of [-0.4, 0.4]) {
          b.cylinder(0.1, 0.12, 0.6, 5, '#8a8460', [x, 0.3, z]);
        }
      }
    },
  },
  {
    // Ewoks about their village, spears in hand.
    sector: 'contributing',
    count: 6,
    motion: 'walk',
    speed: 1.0,
    scale: 1,
    height: 0,
    build: (b) => {
      b.cylinder(0.22, 0.28, 0.5, 6, '#6b4a30', [0, 0.55, 0]);
      b.sphere(0.26, 6, '#8a6a46', [0, 0.98, 0]);
      b.cone(0.3, 0.42, 6, '#b8763c', [0, 1.22, 0]);
      b.sphere(0.04, 4, '#111111', [0.09, 1.0, -0.23]);
      b.sphere(0.04, 4, '#111111', [-0.09, 1.0, -0.23]);
      b.cylinder(0.05, 0.05, 0.4, 4, '#6b4a30', [-0.3, 0.65, 0], [0, 0, 0.5]);
      b.cylinder(0.03, 0.03, 1.5, 4, '#4a3a28', [0.32, 0.9, 0]);
      b.cone(0.07, 0.25, 4, '#d8dde3', [0.32, 1.77, 0]);
    },
  },
  {
    // Tauntauns at a trot through the snow.
    sector: 'contact',
    count: 5,
    motion: 'walk',
    speed: 1.7,
    scale: 0.75,
    height: 0,
    build: (b) => {
      b.sphere(0.7, 8, '#9a8f7a', [0, 1.2, 0], [0.8, 0.8, 1.4]);
      b.cylinder(0.18, 0.26, 0.9, 6, '#9a8f7a', [0, 1.9, -0.8], [0.6, 0, 0]);
      b.sphere(0.3, 6, '#8a7f6a', [0, 2.3, -1.15], [0.9, 0.8, 1.3]);
      b.cone(0.06, 0.4, 4, '#d8c9a8', [0.15, 2.55, -1.1], [-0.4, 0, 0.3]);
      b.cone(0.06, 0.4, 4, '#d8c9a8', [-0.15, 2.55, -1.1], [-0.4, 0, -0.3]);
      b.cylinder(0.12, 0.16, 1.1, 5, '#8a7f6a', [0.3, 0.55, 0.2]);
      b.cylinder(0.12, 0.16, 1.1, 5, '#8a7f6a', [-0.3, 0.55, 0.2]);
      b.cone(0.18, 1.2, 5, '#9a8f7a', [0, 1.0, 1.1], [Math.PI / 2 - 0.3, 0, 0]);
    },
  },
];

interface Creature {
  x: number;
  z: number;
  y: number;
  heading: number;
  speed: number;
  turn: number;
  timer: number;
  phase: number;
  // Of the flyers: the angle on the circle, or the place on the lane, and
  // the distance from the middle.
  along: number;
  offset: number;
  direction: 1 | -1;
}

interface Herd {
  species: Species;
  built: Built;
  creatures: Creature[];
  home: { x: number; z: number };
  obstacles: { x: number; z: number; r: number }[];
}

const dummy = new THREE.Object3D();
const halfWidth = sectorAngle / 2 - 0.1;
const nearest = hubRadius + 10;
const farthest = platformRadius - 8;

const headingTowards = (x: number, z: number, tx: number, tz: number) =>
  Math.atan2(-(tx - x), -(tz - z));

function inside(sector: SectionId, x: number, z: number) {
  const distance = Math.hypot(x, z);
  if (distance < nearest || distance > farthest) return false;
  let angle = Math.atan2(x, -z) - angleOf(sector);
  angle = Math.atan2(Math.sin(angle), Math.cos(angle));
  return Math.abs(angle) < halfWidth;
}

// What stands in the way at a point, if anything: a pad or a prop.
function blocker(herd: Herd, x: number, z: number) {
  return (
    pads.find((pad) => Math.hypot(x - pad.x, z - pad.z) < pad.r + 2.5) ??
    herd.obstacles.find((o) => Math.hypot(x - o.x, z - o.z) < o.r + 1.2) ??
    null
  );
}

function settle(herd: Herd) {
  const { species, home } = herd;
  const next = () => Math.random();
  herd.creatures = Array.from({ length: species.count }, (_, index) => {
    const creature: Creature = {
      x: home.x,
      z: home.z,
      y: species.height,
      heading: next() * Math.PI * 2,
      speed: species.speed,
      turn: 0,
      timer: next() * 2,
      phase: next() * 6,
      along: next() * Math.PI * 2,
      offset: 0,
      direction: index % 2 ? 1 : -1,
    };
    if (species.motion === 'lane') {
      creature.offset =
        (index % 2 ? 1 : -1) * (3 + Math.floor(index / 2) * 2.2);
      creature.along = next() * (farthest - nearest);
      creature.y = species.height + (index % 3) * 1.1;
    } else if (species.motion === 'orbit') {
      creature.offset = 14 + index * 6;
      creature.y = species.height + index * 1.6;
    } else {
      // Somewhere clear in the sector.
      for (let attempt = 0; attempt < 40; attempt++) {
        const angle = angleOf(species.sector) + (next() * 2 - 1) * halfWidth;
        const distance = nearest + next() * (farthest - nearest);
        const x = Math.sin(angle) * distance;
        const z = -Math.cos(angle) * distance;
        if (blocker(herd, x, z)) continue;
        creature.x = x;
        creature.z = z;
        break;
      }
    }
    return creature;
  });
}

function move(herd: Herd, dt: number, time: number) {
  const { species, home } = herd;
  const angle = angleOf(species.sector);
  for (const c of herd.creatures) {
    c.phase += dt * (species.motion === 'hop' ? 4 : 6);
    if (species.motion === 'lane') {
      const length = farthest - nearest;
      c.along = (c.along + c.direction * c.speed * dt + length) % length;
      const distance = nearest + c.along;
      c.x = Math.sin(angle) * distance + Math.cos(angle) * c.offset;
      c.z = -Math.cos(angle) * distance + Math.sin(angle) * c.offset;
      c.heading = c.direction > 0 ? -angle : Math.PI - angle;
      continue;
    }
    if (species.motion === 'orbit') {
      c.along += c.speed * dt;
      const px = home.x + Math.cos(c.along) * c.offset;
      const pz = home.z + Math.sin(c.along) * c.offset;
      c.heading = headingTowards(c.x, c.z, px, pz);
      c.x = px;
      c.z = pz;
      c.y = species.height + Math.sin(time * 0.7 + c.offset) * 0.8;
      continue;
    }
    // Walkers pick a new turn now and then, and the hoppers rest between
    // their hops.
    c.timer -= dt;
    if (c.timer <= 0) {
      c.timer = 1.5 + Math.random() * 3;
      c.turn = (Math.random() - 0.5) * 1.4;
      c.speed = species.speed * (0.5 + Math.random());
    }
    const hopping = species.motion === 'hop';
    const moving = !hopping || Math.sin(c.phase) > 0;
    if (!moving) continue;
    c.heading += c.turn * dt;
    const step = c.speed * dt;
    const nx = c.x - Math.sin(c.heading) * step;
    const nz = c.z - Math.cos(c.heading) * step;
    const wall = blocker(herd, nx, nz);
    if (wall || !inside(species.sector, nx, nz)) {
      // Turns away from what is in the way, or back towards the middle of
      // the sector, and keeps that way for a moment: no dithering.
      const away = wall
        ? headingTowards(wall.x, wall.z, c.x, c.z)
        : headingTowards(c.x, c.z, home.x, home.z);
      c.heading = away + (Math.random() - 0.5) * 0.6;
      c.turn = 0;
      c.timer = 1.5 + Math.random();
      continue;
    }
    c.x = nx;
    c.z = nz;
    c.y =
      groundHeight(nx, nz) +
      (hopping
        ? Math.max(0, Math.sin(c.phase)) * 0.35
        : Math.abs(Math.sin(c.phase)) * 0.06);
  }
}

function place(herd: Herd, meshes: (THREE.InstancedMesh | null)[]) {
  herd.creatures.forEach((c, index) => {
    dummy.position.set(c.x, c.y, c.z);
    dummy.rotation.set(0, c.heading, 0);
    dummy.scale.setScalar(herd.species.scale);
    dummy.updateMatrix();
    for (const mesh of meshes) mesh?.setMatrixAt(index, dummy.matrix);
  });
  for (const mesh of meshes) {
    if (mesh) mesh.instanceMatrix.needsUpdate = true;
  }
}

// The herds live as long as the page: their shapes are small, and the
// animals keep their places between flights.
let cached: Herd[] | null = null;
function getHerds() {
  cached ??= species.map((kind): Herd => {
    const b = new Builder();
    kind.build(b);
    const direction = angleOf(kind.sector);
    const herd: Herd = {
      species: kind,
      built: b.build(),
      creatures: [],
      home: { x: Math.sin(direction) * 64, z: -Math.cos(direction) * 64 },
      obstacles: arena.obstacles.filter(
        (o) => sectorAt(o.x, o.z) === kind.sector,
      ),
    };
    settle(herd);
    return herd;
  });
  return cached;
}

export default function Fauna() {
  const reduced = useReducedMotion();
  const herds = getHerds();
  const meshes = useRef<(THREE.InstancedMesh | null)[][]>(
    herds.map(() => [null, null]),
  );
  const placed = useRef(false);

  useFrame(({ clock }, delta) => {
    if (reduced && placed.current) return;
    placed.current = true;
    const dt = Math.min(delta, 0.1);
    herds.forEach((herd, index) => {
      if (!reduced) move(herd, dt, clock.elapsedTime);
      place(herd, meshes.current[index]);
    });
  });

  return (
    <>
      {herds.map((herd, index) => (
        <group key={herd.species.sector}>
          {herd.built.solid && (
            <instancedMesh
              ref={(mesh) => {
                meshes.current[index][0] = mesh;
              }}
              args={[herd.built.solid, solidMaterial, herd.species.count]}
              frustumCulled={false}
            />
          )}
          {herd.built.lit && (
            <instancedMesh
              ref={(mesh) => {
                meshes.current[index][1] = mesh;
              }}
              args={[herd.built.lit, litMaterial, herd.species.count]}
              frustumCulled={false}
            />
          )}
        </group>
      ))}
    </>
  );
}
