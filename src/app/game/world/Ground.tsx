'use client';

// HOOKS
import { useEffect, useMemo } from 'react';
// THREE
import * as THREE from 'three';
// GAME
import { platformRadius } from './arena';
import { biomes, hubRadius, sectorOfAngle } from './biomes';
import { groundHeight, noise, sectorUnder, smoothstep } from './terrain';

// The ground of the world: one disc whose vertices take the color and the
// relief of the sector they fall in, with the deck of the hub in the
// middle, flat under the pads, and the edge of the platform lit in the
// color of each sector.

const deck = '#24263a';
const brand = '#5c5edc';

function makeGround() {
  const rings = 46;
  const around = 96;
  const positions: number[] = [0, 0, 0];
  const colors: number[] = [];
  const color = new THREE.Color();
  const deckColor = new THREE.Color(deck);
  const dark = new THREE.Color('#000000');
  colors.push(deckColor.r, deckColor.g, deckColor.b);
  for (let ring = 1; ring <= rings; ring++) {
    const r = (platformRadius * ring) / rings;
    for (let j = 0; j < around; j++) {
      const angle = (j / around) * Math.PI * 2;
      const x = Math.sin(angle) * r;
      const z = -Math.cos(angle) * r;
      const biome = biomes[sectorUnder(x, z)];
      positions.push(x, groundHeight(x, z), z);
      const n = noise(x * 1.7, z * 1.7);
      color.set(biome.ground[0]).lerp(new THREE.Color(biome.ground[1]), n);
      color.lerp(dark, 0.12 * (1 - n));
      color.lerp(deckColor, 1 - smoothstep(hubRadius, hubRadius + 5, r));
      colors.push(color.r, color.g, color.b);
    }
  }
  const indices: number[] = [];
  // Wound to face up: counter-clockwise seen from above.
  for (let j = 0; j < around; j++) {
    indices.push(0, 1 + ((j + 1) % around), 1 + j);
  }
  for (let ring = 0; ring < rings - 1; ring++) {
    for (let j = 0; j < around; j++) {
      const a = 1 + ring * around + j;
      const b = 1 + ring * around + ((j + 1) % around);
      const c = a + around;
      const d = b + around;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// The lit edge of the platform, in the color of each sector.
function makeEdge(inner: number, outer: number) {
  const geometry = new THREE.RingGeometry(inner, outer, 96);
  geometry.rotateX(-Math.PI / 2);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < position.count; i++) {
    const angle = Math.atan2(position.getX(i), -position.getZ(i));
    color.set(biomes[sectorOfAngle(angle)].accent);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

export default function Ground() {
  const ground = useMemo(() => makeGround(), []);
  const edge = useMemo(
    () => makeEdge(platformRadius - 1.2, platformRadius),
    [],
  );
  const glow = useMemo(() => makeEdge(platformRadius, platformRadius + 3), []);
  useEffect(
    () => () => {
      ground.dispose();
      edge.dispose();
      glow.dispose();
    },
    [ground, edge, glow],
  );

  return (
    <group>
      <mesh geometry={ground}>
        <meshStandardMaterial vertexColors roughness={0.95} flatShading />
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
      {/* The deck of the hub, where the ships start. */}
      <polarGridHelper
        args={[hubRadius, 8, 3, 48, '#3b3f62', '#2c2f4a']}
        position-y={0.03}
      />
      <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
        <ringGeometry args={[hubRadius - 0.5, hubRadius, 64]} />
        <meshBasicMaterial color={brand} transparent opacity={0.6} />
      </mesh>
      <mesh geometry={edge} position-y={0.04}>
        <meshBasicMaterial vertexColors />
      </mesh>
      <mesh geometry={glow} position-y={0.02}>
        <meshBasicMaterial vertexColors transparent opacity={0.22} />
      </mesh>
    </group>
  );
}
