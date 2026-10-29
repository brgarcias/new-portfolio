'use client';

// HOOKS
import { useEffect, useMemo, useRef } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// GAME
import { useReducedMotion } from '../useMediaQuery';
import { atmosphere, paletteOf, type Palette, type Sector } from './biomes';

// The sky, the stars, the fog and the lights, which follow the ship from
// sector to sector: as it crosses into another planet's slice, the colors
// of the sky and of the light ease over to that planet's. Over Kamino,
// lightning now and then.

const skyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 top;
  uniform vec3 horizon;
  uniform vec3 below;
  uniform float flash;
  varying vec3 vDirection;
  void main() {
    float height = normalize(vDirection).y;
    vec3 color = height >= 0.0
      ? mix(horizon, top, min(1.0, height * 2.2))
      : mix(horizon, below, min(1.0, -height * 3.0));
    color += flash;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// A small random number generator with a seed, for the stars.
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

interface Colors {
  top: THREE.Color;
  horizon: THREE.Color;
  below: THREE.Color;
  fog: THREE.Color;
  skyLight: THREE.Color;
  groundLight: THREE.Color;
  sun: THREE.Color;
}

const targets = new Map<Sector, Colors>();
function colorsOf(sector: Sector): Colors {
  let colors = targets.get(sector);
  if (!colors) {
    const palette = paletteOf(sector);
    colors = {
      top: new THREE.Color(palette.top),
      horizon: new THREE.Color(palette.horizon),
      below: new THREE.Color(palette.below),
      fog: new THREE.Color(palette.fog),
      skyLight: new THREE.Color(palette.skyLight),
      groundLight: new THREE.Color(palette.groundLight),
      sun: new THREE.Color(palette.sun),
    };
    targets.set(sector, colors);
  }
  return colors;
}

const towards = (value: number, target: number, k: number) =>
  value + (target - value) * k;

// The colors of the sky, which the frame loop eases towards the sector's.
const skyUniforms = {
  top: { value: new THREE.Color(paletteOf('hub').top) },
  horizon: { value: new THREE.Color(paletteOf('hub').horizon) },
  below: { value: new THREE.Color(paletteOf('hub').below) },
  flash: { value: 0 },
};

export default function Atmosphere() {
  const reduced = useReducedMotion();
  const hemisphere = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const starsMaterial = useRef<THREE.PointsMaterial>(null);
  const state = useRef({
    density: paletteOf('hub').density,
    stars: paletteOf('hub').stars,
    sunIntensity: paletteOf('hub').sunIntensity,
    flash: 0,
    nextFlash: 6,
  });

  const sky = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
  }, []);
  useEffect(() => () => sky.dispose(), [sky]);

  const stars = useMemo(() => {
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

  useFrame(({ scene }, delta) => {
    const dt = Math.min(delta, 0.1);
    const k = reduced ? 1 : 1 - Math.exp(-1.4 * dt);
    const sector = atmosphere.sector;
    const palette: Palette = paletteOf(sector);
    const target = colorsOf(sector);
    const current = state.current;
    skyUniforms.top.value.lerp(target.top, k);
    skyUniforms.horizon.value.lerp(target.horizon, k);
    skyUniforms.below.value.lerp(target.below, k);
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.lerp(target.fog, k);
      current.density = towards(current.density, palette.density, k);
      scene.fog.density = current.density;
    }
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(target.fog, k);
    }
    current.stars = towards(current.stars, palette.stars, k);
    if (starsMaterial.current) starsMaterial.current.opacity = current.stars;
    if (hemisphere.current) {
      hemisphere.current.color.lerp(target.skyLight, k);
      hemisphere.current.groundColor.lerp(target.groundLight, k);
    }
    current.sunIntensity = towards(
      current.sunIntensity,
      palette.sunIntensity,
      k,
    );
    // The storm over the ocean world.
    if (sector === 'courses' && !reduced) {
      current.nextFlash -= dt;
      if (current.nextFlash <= 0) {
        current.flash = 1;
        current.nextFlash = 5 + Math.random() * 8;
      }
    }
    current.flash *= Math.exp(-7 * dt);
    skyUniforms.flash.value = current.flash * 0.6;
    if (sun.current) {
      sun.current.color.lerp(target.sun, k);
      sun.current.intensity = current.sunIntensity + current.flash * 4;
    }
  });

  return (
    <>
      <hemisphereLight
        ref={hemisphere}
        args={[paletteOf('hub').skyLight, paletteOf('hub').groundLight, 1.2]}
      />
      <directionalLight
        ref={sun}
        position={[60, 90, 30]}
        intensity={paletteOf('hub').sunIntensity}
        color={paletteOf('hub').sun}
      />
      <mesh material={sky}>
        <sphereGeometry args={[900, 32, 20]} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={starsMaterial}
          size={1.8}
          color="#dfe3ff"
          sizeAttenuation
          transparent
          fog={false}
        />
      </points>
    </>
  );
}
