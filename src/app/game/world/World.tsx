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
import { flora, pads, padRadius, props } from './arena';
import Atmosphere from './Atmosphere';
import { biomes, hubRadius, sectorAt, space } from './biomes';
import { Builder, litMaterial, solidMaterial, type Vec } from './builder';
import Far from './Far';
import Fauna from './Fauna';
import Ground from './Ground';
import { floraBuilders, propBuilders } from './props';
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
const beaconColor = new THREE.Color();
const beaconDummy = new THREE.Object3D();

function Beacons({ at }: { at: Vec[] }) {
  const reduced = useReducedMotion();
  const mesh = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const instances = mesh.current;
    if (!instances) return;
    at.forEach((position, index) => {
      beaconDummy.position.set(...position);
      beaconDummy.updateMatrix();
      instances.setMatrixAt(index, beaconDummy.matrix);
      const sector = sectorAt(position[0], position[2]);
      beaconColor.set(sector === 'hub' ? brand : biomes[sector].accent);
      instances.setColorAt(index, beaconColor);
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
// shape in the light and one lit on its own.
function Sectors() {
  const built = useMemo(() => {
    const beacons: Vec[] = [];
    const parts = sectionIds.map((id) => {
      const b = new Builder();
      for (const prop of props) {
        if (prop.sector === id)
          propBuilders[id][prop.kind](b, prop, { beacons });
      }
      for (const item of flora) {
        if (item.sector === id) floraBuilders[item.kind](b, item);
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

// A landing pad: a low disc with a lit ring and a beam of light above it,
// brighter while the ship is on it, and in another color once it has been
// visited.
function LandingPad({
  x,
  z,
  active,
  visited,
}: {
  x: number;
  z: number;
  active: boolean;
  visited: boolean;
}) {
  let color = brand;
  if (active) color = '#c4c5ff';
  else if (visited) color = '#22d3ee';
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={0.15}>
        <cylinderGeometry args={[padRadius, padRadius + 0.4, 0.3, 48]} />
        <meshStandardMaterial color="#232640" roughness={0.9} flatShading />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.32}>
        <ringGeometry args={[padRadius - 0.7, padRadius, 48]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.32}>
        <circleGeometry args={[1.2, 24]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.31}>
        <ringGeometry args={[padRadius, padRadius + 2.5, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
      <mesh position-y={7}>
        <cylinderGeometry args={[0.12, 0.3, 14, 6, 1, true]} />
        <meshBasicMaterial
          color="#8f8fff"
          transparent
          opacity={active ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
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
      {pads.map((pad) => (
        <LandingPad
          key={pad.id}
          x={pad.x}
          z={pad.z}
          active={pad.id === activePad}
          visited={visited.includes(pad.id)}
        />
      ))}
    </>
  );
}
