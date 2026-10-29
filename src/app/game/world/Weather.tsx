'use client';

// HOOKS
import { useEffect, useMemo } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// CONTENT
import { sectionIds } from '@/src/content/sections';
// GAME
import { useReducedMotion } from '../useMediaQuery';
import { platformRadius } from './arena';
import {
  angleOf,
  biomes,
  hubRadius,
  sectorAngle,
  type Weather,
} from './biomes';

// What falls or drifts over each sector: sand, spores, rain, pollen,
// fireflies and snow. Each is a cloud of points that the shader moves, so
// the frame loop only tells it the time.

const kinds: Record<Weather, number> = {
  sand: 0,
  spores: 1,
  rain: 2,
  pollen: 3,
  fireflies: 4,
  snow: 5,
};

const vertexShader = /* glsl */ `
  uniform float time;
  uniform float kind;
  uniform float height;
  uniform float spread;
  uniform float size;
  attribute float seed;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float t = time * (0.7 + 0.6 * seed);
    float swirl = seed * 6.2832;
    if (kind < 0.5) {
      // Sand, blown low over the dunes.
      p.x = mod(p.x + spread + t * 7.0, spread * 2.0) - spread;
      p.y = mod(p.y + sin(t * 1.3 + swirl) * 0.4, height);
    } else if (kind < 1.5) {
      // Spores, drifting up through the mist.
      p.y = mod(p.y + t * 0.45, height);
      p.x += sin(t * 0.7 + swirl) * 1.6;
      p.z += cos(t * 0.5 + swirl) * 1.6;
    } else if (kind < 2.5) {
      // Rain.
      p.y = height - mod(p.y + t * 26.0, height);
    } else if (kind < 3.5) {
      // Pollen on the breeze.
      p.y = mod(p.y + t * 0.3, height);
      p.x += sin(t + swirl) * 2.0;
      p.z += cos(t * 0.8 + swirl) * 2.0;
    } else if (kind < 4.5) {
      // Fireflies, low among the trees.
      p.y = 0.8 + mod(p.y, 2.5) + sin(t * 0.9 + swirl) * 0.5;
      p.x += sin(t * 0.6 + seed * 9.0) * 1.4;
      p.z += cos(t * 0.5 + seed * 7.0) * 1.4;
    } else {
      // Snow, swaying as it falls.
      p.y = height - mod(p.y + t * 2.4, height);
      p.x += sin(t * 0.8 + swirl) * 1.2;
    }
    vAlpha = kind > 3.5 && kind < 4.5
      ? 0.2 + 0.8 * max(0.0, sin(t * 2.5 + seed * 12.0))
      : 0.6;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(size * (220.0 / -mvPosition.z), 1.0, 14.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 color;
  varying float vAlpha;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    if (dot(d, d) > 0.25) discard;
    gl_FragColor = vec4(color, vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface Cloud {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  position: [number, number, number];
}

// A small random number generator with a seed.
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

const settings: Record<
  Weather,
  { count: number; height: number; size: number }
> = {
  sand: { count: 420, height: 3, size: 0.4 },
  spores: { count: 360, height: 9, size: 0.65 },
  rain: { count: 900, height: 24, size: 0.45 },
  pollen: { count: 320, height: 8, size: 0.55 },
  fireflies: { count: 160, height: 3, size: 1.1 },
  snow: { count: 650, height: 20, size: 0.75 },
};

// The time all the clouds share, which the frame loop advances.
const timeUniform = { value: 0 };

function makeClouds(): Cloud[] {
  const clouds: Cloud[] = [];
  for (const id of sectionIds) {
    const biome = biomes[id];
    if (!biome.weather) continue;
    const { count, height, size } = settings[biome.weather];
    const next = random(sectionIds.indexOf(id) + 3);
    const angle = angleOf(id);
    const middle = (hubRadius + platformRadius) / 2;
    const center: [number, number, number] = [
      Math.sin(angle) * middle,
      0,
      -Math.cos(angle) * middle,
    ];
    const spread = (platformRadius - hubRadius) / 2;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Spread over the sector's slice, around its middle.
      const a = angle + (next() * 2 - 1) * (sectorAngle / 2 - 0.04);
      const distance =
        hubRadius + 4 + next() * (platformRadius - hubRadius - 8);
      positions[i * 3] = Math.sin(a) * distance - center[0];
      positions[i * 3 + 1] = next() * height;
      positions[i * 3 + 2] = -Math.cos(a) * distance - center[2];
      seeds[i] = next();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    // The shader moves the points, so the bounds are set by hand.
    geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, height / 2, 0),
      spread + height,
    );
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: timeUniform,
        kind: { value: kinds[biome.weather] },
        height: { value: height },
        spread: { value: spread },
        size: { value: size },
        color: { value: new THREE.Color(biome.weatherColor ?? '#ffffff') },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });
    clouds.push({ geometry, material, position: center });
  }
  return clouds;
}

export default function WeatherClouds() {
  const clouds = useMemo(() => makeClouds(), []);
  const reduced = useReducedMotion();

  useEffect(
    () => () => {
      for (const cloud of clouds) {
        cloud.geometry.dispose();
        cloud.material.dispose();
      }
    },
    [clouds],
  );

  useFrame((_, delta) => {
    if (!reduced) timeUniform.value += Math.min(delta, 0.1);
  });

  return (
    <>
      {clouds.map((cloud, index) => (
        <points
          key={index}
          geometry={cloud.geometry}
          material={cloud.material}
          position={cloud.position}
        />
      ))}
    </>
  );
}
