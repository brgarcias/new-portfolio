'use client';

// HOOKS
import { useEffect, useMemo, useRef } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// CONTENT
import { sectionIds, type SectionId } from '@/src/content/sections';
// GAME
import { useReducedMotion } from '../useMediaQuery';
// WORLD
import { flora, landmarks, pads, padRadius, props } from './arena';
import Atmosphere from './Atmosphere';
import { biomes, hubRadius, sectorAt, space } from './biomes';
import { Builder, litMaterial, solidMaterial, type Vec } from './builder';
import Far from './Far';
import Fauna from './Fauna';
import Ground from './Ground';
import Holocrons from './Holocrons';
import {
  floraBuilders,
  landmarkBuilders,
  padBuilders,
  propBuilders,
} from './props';
import { groundHeight } from './terrain';
import Waters from './Water';
import WeatherClouds from './Weather';

const brand = '#5c5edc';

// A small random number generator with a seed, for the dust.
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

// Specks of dust drifting slowly over the deck of the hub.
function Dust() {
  const positions = useMemo(() => {
    const next = random(11);
    const points = new Float32Array(220 * 3);
    for (let i = 0; i < points.length; i += 3) {
      const radius = 3 + next() * (hubRadius + 6);
      const angle = next() * Math.PI * 2;
      points[i] = Math.cos(angle) * radius;
      points[i + 1] = 1 + next() * 12;
      points[i + 2] = Math.sin(angle) * radius;
    }
    return points;
  }, []);
  const cloud = useRef<THREE.Points>(null);
  const reduced = useReducedMotion();
  useFrame((_, delta) => {
    if (cloud.current && !reduced) cloud.current.rotation.y += delta * 0.012;
  });
  return (
    <points ref={cloud}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.18}
        color="#9c9eff"
        transparent
        opacity={0.35}
        sizeAttenuation
      />
    </points>
  );
}

// The lights on top of the masts share one material, which pulses, each
// in the color of its sector.
const beacon = new THREE.MeshBasicMaterial({
  color: '#ffffff',
  transparent: true,
});
const color = new THREE.Color();
const dummy = new THREE.Object3D();

function Beacons({ at }: { at: Vec[] }) {
  const reduced = useReducedMotion();
  const mesh = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const instances = mesh.current;
    if (!instances) return;
    at.forEach((position, index) => {
      dummy.position.set(...position);
      dummy.updateMatrix();
      instances.setMatrixAt(index, dummy.matrix);
      const sector = sectorAt(position[0], position[2]);
      color.set(sector === 'hub' ? brand : biomes[sector].accent);
      instances.setColorAt(index, color);
    });
    instances.instanceMatrix.needsUpdate = true;
    if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
  }, [at]);
  useFrame(({ clock }) => {
    beacon.opacity = reduced
      ? 1
      : 0.55 + 0.45 * Math.sin(clock.elapsedTime * 3);
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, beacon, at.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.45, 8, 8]} />
    </instancedMesh>
  );
}

// The props and the plants of every sector, each sector merged into one
// shape in the light and one lit on its own, each thing standing on the
// ground's relief.
function Sectors() {
  const built = useMemo(() => {
    const beacons: Vec[] = [];
    const parts = sectionIds.map((id) => {
      const b = new Builder();
      for (const prop of props) {
        if (prop.sector !== id) continue;
        b.lift = groundHeight(prop.x, prop.z);
        propBuilders[id][prop.kind](b, prop, { beacons });
      }
      for (const item of flora) {
        if (item.sector !== id) continue;
        b.lift = groundHeight(item.x, item.z);
        floraBuilders[item.kind](b, item);
      }
      // The pad, as a place of the planet, and the landmark beside it.
      const pad = pads.find((landing) => landing.id === id);
      if (pad) {
        b.lift = 0;
        padBuilders[id](b, pad);
      }
      const mark = landmarks.find((landmark) => landmark.id === id);
      if (mark) {
        b.lift = groundHeight(mark.x, mark.z);
        landmarkBuilders[id](b, mark);
      }
      return b.build();
    });
    return { parts, beacons };
  }, []);
  useEffect(
    () => () => {
      for (const part of built.parts) {
        part.solid?.dispose();
        part.lit?.dispose();
      }
    },
    [built],
  );
  return (
    <>
      {built.parts.map((part, index) => (
        <group key={sectionIds[index]}>
          {part.solid && (
            <mesh geometry={part.solid} material={solidMaterial} />
          )}
          {part.lit && <mesh geometry={part.lit} material={litMaterial} />}
        </group>
      ))}
      <Beacons at={built.beacons} />
    </>
  );
}

interface PadsProps {
  activePad: SectionId | null;
  visited: SectionId[];
}

// The landing pads' lights: the rings, the centers, the glows and the
// beams drawn as instances, in the color of each pad's planet, brighter
// while the ship is on it, and in another color once it has been visited.
// The ground of each pad is part of its sector, in props.ts.
function Pads({ activePad, visited }: Readonly<PadsProps>) {
  const shapes = useMemo(() => {
    const ring = new THREE.RingGeometry(padRadius - 0.7, padRadius, 48);
    ring.rotateX(-Math.PI / 2);
    ring.translate(0, 0.32, 0);
    const center = new THREE.CircleGeometry(1.2, 24);
    center.rotateX(-Math.PI / 2);
    center.translate(0, 0.32, 0);
    const glow = new THREE.RingGeometry(padRadius, padRadius + 2.5, 48);
    glow.rotateX(-Math.PI / 2);
    glow.translate(0, 0.31, 0);
    const beam = new THREE.CylinderGeometry(0.1, 0.22, 14, 6, 1, true);
    beam.translate(0, 7, 0);
    return { ring, center, glow, beam };
  }, []);
  const materials = useMemo(
    () => ({
      lit: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      glow: new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.18,
      }),
      beam: new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
      }),
    }),
    [],
  );
  const rings = useRef<THREE.InstancedMesh>(null);
  const centers = useRef<THREE.InstancedMesh>(null);
  const glows = useRef<THREE.InstancedMesh>(null);
  const beams = useRef<THREE.InstancedMesh>(null);

  useEffect(
    () => () => {
      for (const shape of Object.values(shapes)) shape.dispose();
      for (const material of Object.values(materials)) material.dispose();
    },
    [shapes, materials],
  );

  // The instances stand on their pads.
  useEffect(() => {
    for (const mesh of [rings, centers, glows, beams]) {
      const instances = mesh.current;
      if (!instances) continue;
      pads.forEach((pad, index) => {
        dummy.position.set(pad.x, 0, pad.z);
        dummy.updateMatrix();
        instances.setMatrixAt(index, dummy.matrix);
      });
      instances.instanceMatrix.needsUpdate = true;
    }
  }, []);

  // And take the color of their state.
  useEffect(() => {
    pads.forEach((pad, index) => {
      const active = pad.id === activePad;
      if (active) color.set('#c4c5ff');
      else if (visited.includes(pad.id)) color.set('#22d3ee');
      else color.set(biomes[pad.id].accent);
      rings.current?.setColorAt(index, color);
      centers.current?.setColorAt(index, color);
      glows.current?.setColorAt(index, color);
      color.set('#8f8fff').multiplyScalar(active ? 1 : 0.55);
      beams.current?.setColorAt(index, color);
    });
    for (const mesh of [rings, centers, glows, beams]) {
      const instances = mesh.current;
      if (instances?.instanceColor) instances.instanceColor.needsUpdate = true;
    }
  }, [activePad, visited]);

  return (
    <group>
      <instancedMesh
        ref={rings}
        args={[shapes.ring, materials.lit, pads.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={centers}
        args={[shapes.center, materials.lit, pads.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={glows}
        args={[shapes.glow, materials.glow, pads.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={beams}
        args={[shapes.beam, materials.beam, pads.length]}
        frustumCulled={false}
      />
    </group>
  );
}

interface WorldProps {
  activePad: SectionId | null;
  visited: SectionId[];
}

export default function World({ activePad, visited }: Readonly<WorldProps>) {
  return (
    <>
      <color attach="background" args={[space.fog]} />
      <fogExp2 attach="fog" args={[space.fog, space.density]} />
      <Atmosphere />
      <Far />
      <Dust />
      <Ground />
      <Sectors />
      <Waters />
      <WeatherClouds />
      <Fauna />
      <Holocrons />
      <Pads activePad={activePad} visited={visited} />
    </>
  );
}
