'use client';

// HOOKS
import { useEffect, useMemo } from 'react';
// GAME
import { Builder, litMaterial, solidMaterial } from './builder';
import { directionOf } from './biomes';

// What each planet shows beyond the edge of the platform: the two suns
// of the desert, the gas giant the forest moon circles, the skyline of
// the city and the clouds over the ocean and the meadows. They sit far
// out, in the direction of their sector.

function Suns() {
  const d = directionOf('about');
  return (
    <group>
      <mesh position={[d.x * 600 - d.z * 40, 118, d.z * 600 + d.x * 40]}>
        <sphereGeometry args={[26, 16, 12]} />
        <meshBasicMaterial color="#ffe9b0" fog={false} />
      </mesh>
      <mesh position={[d.x * 600 + d.z * 45, 92, d.z * 600 - d.x * 45]}>
        <sphereGeometry args={[16, 16, 12]} />
        <meshBasicMaterial color="#ffb86b" fog={false} />
      </mesh>
    </group>
  );
}

function GasGiant() {
  const d = directionOf('contributing');
  return (
    <group position={[d.x * 700, 240, d.z * 700]}>
      <mesh>
        <sphereGeometry args={[105, 24, 16]} />
        <meshStandardMaterial color="#7d6fd6" flatShading fog={false} />
      </mesh>
      <mesh rotation={[1.25, 0.35, 0]}>
        <torusGeometry args={[165, 12, 6, 48]} />
        <meshStandardMaterial color="#b9b4f2" flatShading fog={false} />
      </mesh>
    </group>
  );
}

// A small random number generator with a seed.
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

function Skyline() {
  const built = useMemo(() => {
    const b = new Builder();
    const next = random(21);
    const d = directionOf('experience');
    const base = Math.atan2(d.x, -d.z);
    for (let i = 0; i < 18; i++) {
      const angle = base + (next() * 2 - 1) * 0.4;
      const distance = 150 + next() * 70;
      const width = 8 + next() * 10;
      const height = 25 + next() * 50;
      const x = Math.sin(angle) * distance;
      const z = -Math.cos(angle) * distance;
      b.box(
        [width, height, width],
        '#141830',
        [x, height / 2 - 30, z],
        [0, angle, 0],
      );
      for (let y = -24; y < height - 32; y += 7) {
        b.box(
          [width + 0.3, 0.6, width + 0.3],
          '#3b4f7a',
          [x, y, z],
          [0, angle, 0],
          true,
        );
      }
    }
    return b.build();
  }, []);
  useEffect(
    () => () => {
      built.solid?.dispose();
      built.lit?.dispose();
    },
    [built],
  );
  return (
    <group>
      {built.solid && <mesh geometry={built.solid} material={solidMaterial} />}
      {built.lit && <mesh geometry={built.lit} material={litMaterial} />}
    </group>
  );
}

// A few clouds over a sector, all in one shape.
function Clouds({
  sector,
  color,
  height,
  count,
}: {
  sector: 'projects' | 'courses';
  color: string;
  height: number;
  count: number;
}) {
  const built = useMemo(() => {
    const b = new Builder();
    const next = random(sector === 'projects' ? 31 : 37);
    const d = directionOf(sector);
    const base = Math.atan2(d.x, -d.z);
    for (let i = 0; i < count; i++) {
      const angle = base + (next() * 2 - 1) * 0.3;
      const distance = 70 + next() * 60;
      const x = Math.sin(angle) * distance;
      const y = height + next() * 14;
      const z = -Math.cos(angle) * distance;
      const size = 9 + next() * 8;
      b.sphere(size, 10, color, [x, y, z], [1.6, 0.55, 1]);
      b.sphere(
        size * 0.7,
        9,
        color,
        [x + size * 0.9, y + size * 0.15, z],
        [1.1, 0.5, 0.9],
      );
    }
    return b.build().solid;
  }, [sector, color, height, count]);
  useEffect(() => () => built?.dispose(), [built]);
  return built ? <mesh geometry={built} material={solidMaterial} /> : null;
}

export default function Far() {
  return (
    <>
      <Suns />
      <GasGiant />
      <Skyline />
      <Clouds sector="projects" color="#f7faff" height={52} count={4} />
      <Clouds sector="courses" color="#3a4250" height={40} count={3} />
    </>
  );
}
