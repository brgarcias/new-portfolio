'use client';

// HOOKS
import { useEffect, useMemo, useRef } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { useReducedMotion } from '../useMediaQuery';
// WORLD
import { pads, padRadius, platformRadius, props, type Prop } from './arena';

const brand = '#5c5edc';

// A small random number generator with a seed, for the stars and the dust.
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

// The sky: a sphere seen from inside, dark overhead and glowing purple at
// the horizon, colored by vertex. The fog does not reach it.
function Sky() {
  const geometry = useMemo(() => {
    const sphere = new THREE.SphereGeometry(900, 32, 20);
    const position = sphere.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const overhead = new THREE.Color('#07080f');
    const horizon = new THREE.Color('#1d1848');
    const below = new THREE.Color('#0b0c14');
    const color = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const height = position.getY(i) / 900;
      if (height >= 0) {
        color.copy(horizon).lerp(overhead, Math.min(1, height * 2.2));
      } else {
        color.copy(horizon).lerp(below, Math.min(1, -height * 3));
      }
      colors.set([color.r, color.g, color.b], i * 3);
    }
    sphere.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return sphere;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} />
    </mesh>
  );
}

// Stars all around, far away, with a fixed random sequence.
function Stars() {
  const positions = useMemo(() => {
    const next = random(7);
    const points = new Float32Array(1800 * 3);
    for (let i = 0; i < points.length; i += 3) {
      const theta = next() * Math.PI * 2;
      // More of them above the platform than below, and never past the
      // top, where the square root would give nothing.
      const y = next() * 1.35 - 0.35;
      const radius = 640;
      const horizontal = Math.sqrt(1 - y * y) * radius;
      points[i] = Math.cos(theta) * horizontal;
      points[i + 1] = y * radius;
      points[i + 2] = Math.sin(theta) * horizontal;
    }
    return points;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={1.8} color="#dfe3ff" sizeAttenuation fog={false} />
    </points>
  );
}

// A ringed planet on the horizon, in the brand's purple.
function Planet() {
  return (
    <group position={[-380, 150, -540]}>
      <mesh>
        <sphereGeometry args={[110, 24, 16]} />
        <meshStandardMaterial color="#7d6fd6" flatShading fog={false} />
      </mesh>
      <mesh rotation={[1.25, 0.35, 0]}>
        <torusGeometry args={[172, 13, 6, 48]} />
        <meshStandardMaterial color="#b9b4f2" flatShading fog={false} />
      </mesh>
    </group>
  );
}

// Specks of dust drifting slowly over the deck.
function Dust() {
  const positions = useMemo(() => {
    const next = random(11);
    const points = new Float32Array(500 * 3);
    for (let i = 0; i < points.length; i += 3) {
      const radius = 10 + next() * (platformRadius - 15);
      const angle = next() * Math.PI * 2;
      points[i] = Math.cos(angle) * radius;
      points[i + 1] = 1 + next() * 14;
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

function Platform() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[platformRadius, 72]} />
        <meshStandardMaterial color="#24263a" roughness={0.9} flatShading />
      </mesh>
      <mesh position-y={-2}>
        <cylinderGeometry
          args={[platformRadius, platformRadius * 0.96, 4, 72, 1, true]}
        />
        <meshStandardMaterial
          color="#14151f"
          flatShading
          side={THREE.DoubleSide}
        />
      </mesh>
      <polarGridHelper
        args={[platformRadius, 14, 8, 72, '#3b3f62', '#2c2f4a']}
        position-y={0.03}
      />
      <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
        <ringGeometry args={[platformRadius - 1.2, platformRadius, 72]} />
        <meshBasicMaterial color={brand} />
      </mesh>
      {/* The glow past the edge. */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[platformRadius, platformRadius + 3, 72]} />
        <meshBasicMaterial color={brand} transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function Crate({ prop }: { prop: Prop }) {
  const side = prop.r * 1.35;
  return (
    <mesh
      position={[prop.x, prop.height / 2, prop.z]}
      rotation-y={prop.rotation}
    >
      <boxGeometry args={[side, prop.height, side]} />
      <meshStandardMaterial color="#4f5480" roughness={0.8} flatShading />
    </mesh>
  );
}

function Pillar({ prop }: { prop: Prop }) {
  return (
    <mesh position={[prop.x, prop.height / 2, prop.z]}>
      <cylinderGeometry args={[prop.r * 0.8, prop.r, prop.height, 8]} />
      <meshStandardMaterial color="#484d74" roughness={0.85} flatShading />
    </mesh>
  );
}

// The lights on top of the masts share one material, which pulses.
const beacon = new THREE.MeshBasicMaterial({
  color: '#22d3ee',
  transparent: true,
});

function Mast({ prop }: { prop: Prop }) {
  return (
    <group position={[prop.x, 0, prop.z]}>
      <mesh position-y={0.4}>
        <boxGeometry args={[1.4, 0.8, 1.4]} />
        <meshStandardMaterial color="#4f5480" flatShading />
      </mesh>
      <mesh position-y={prop.height / 2}>
        <cylinderGeometry args={[0.16, 0.26, prop.height, 6]} />
        <meshStandardMaterial color="#8f94a8" flatShading />
      </mesh>
      <mesh position-y={prop.height + 0.3} material={beacon}>
        <sphereGeometry args={[0.45, 8, 8]} />
      </mesh>
    </group>
  );
}

function Rock({ prop }: { prop: Prop }) {
  return (
    <mesh
      position={[prop.x, prop.r * 0.55, prop.z]}
      rotation={[prop.rotation * 0.3, prop.rotation, 0]}
    >
      <dodecahedronGeometry args={[prop.r, 0]} />
      <meshStandardMaterial color="#4a4e6e" roughness={1} flatShading />
    </mesh>
  );
}

const kinds = { crate: Crate, pillar: Pillar, mast: Mast, rock: Rock };

// Pulses the beacons of the masts.
function Beacons() {
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    beacon.opacity = reduced
      ? 1
      : 0.55 + 0.45 * Math.sin(clock.elapsedTime * 3);
  });
  return null;
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
      <color attach="background" args={['#0b0c14']} />
      <fogExp2 attach="fog" args={['#0b0c14', 0.0032]} />
      <hemisphereLight args={['#9c9eff', '#171826', 1.2]} />
      <directionalLight
        position={[60, 90, 30]}
        intensity={1.9}
        color="#fff2e0"
      />
      <Sky />
      <Stars />
      <Planet />
      <Dust />
      <Platform />
      <Beacons />
      {props.map((prop, index) => {
        const Kind = kinds[prop.kind];
        return <Kind key={index} prop={prop} />;
      })}
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
