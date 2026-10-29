'use client';

// HOOKS
import { useEffect, useMemo } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// GAME
import { useReducedMotion } from '../useMediaQuery';
import { platformRadius } from './arena';
import { angleOf, directionOf, hubRadius, sectorAngle } from './biomes';

// The waters of the world: the sea of Kamino over its whole sector, the
// lake of Naboo, which spills over the edge of the platform in two
// waterfalls, and the pools of the swamp. The ripples and the falls are
// drawn by shaders that only need the time.

const waterVertex = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec3 vWorld;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorld = worldPosition.xyz;
    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const waterFragment = /* glsl */ `
  #include <fog_pars_fragment>
  uniform float time;
  uniform vec3 deep;
  uniform vec3 shallow;
  uniform float opacity;
  varying vec3 vWorld;
  void main() {
    float w = sin(vWorld.x * 0.35 + time * 1.1) * sin(vWorld.z * 0.3 - time * 0.9);
    w += 0.5 * sin((vWorld.x + vWorld.z) * 0.9 + time * 1.7);
    float crest = smoothstep(0.95, 1.35, w);
    vec3 color = mix(deep, shallow, 0.5 + 0.3 * w) + crest * 0.14;
    gl_FragColor = vec4(color, opacity);
    #include <fog_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const fallVertex = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fallFragment = /* glsl */ `
  #include <fog_pars_fragment>
  uniform float time;
  varying vec2 vUv;
  void main() {
    float s = fract(vUv.y * 5.0 + time * 0.9 + sin(vUv.x * 18.0 + time) * 0.08);
    float streak = smoothstep(0.55, 1.0, s);
    vec3 color = mix(vec3(0.45, 0.72, 0.92), vec3(1.0), streak);
    float alpha = 0.85 * smoothstep(0.0, 0.3, vUv.y);
    gl_FragColor = vec4(color, alpha);
    #include <fog_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// The time all the waters share, which the frame loop advances.
const timeUniform = { value: 0 };

function water(deep: string, shallow: string, opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      time: timeUniform,
      deep: { value: new THREE.Color(deep) },
      shallow: { value: new THREE.Color(shallow) },
      opacity: { value: opacity },
    },
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
}

// A slice of a ring, flat on the ground.
function slice(inner: number, outer: number, from: number, to: number) {
  const steps = 24;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    positions.push(Math.sin(a) * inner, 0, -Math.cos(a) * inner);
    positions.push(Math.sin(a) * outer, 0, -Math.cos(a) * outer);
    if (i < steps) {
      const k = i * 2;
      indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  return geometry;
}

const level = 0.1;

export default function Waters() {
  const reduced = useReducedMotion();
  const parts = useMemo(() => {
    const sea = water('#163a52', '#2f7f9a', 0.92);
    const lake = water('#1f6f8a', '#5fc3d6', 0.9);
    const pool = water('#1d2a1a', '#3f5a3a', 0.92);
    const fall = new THREE.ShaderMaterial({
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        time: timeUniform,
      },
      vertexShader: fallVertex,
      fragmentShader: fallFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: true,
    });
    const kamino = angleOf('courses');
    const seaGeometry = slice(
      hubRadius + 0.5,
      platformRadius - 0.3,
      kamino - sectorAngle / 2,
      kamino + sectorAngle / 2,
    );
    const naboo = directionOf('projects');
    const lakeAt: [number, number, number] = [
      naboo.x * 90,
      level,
      naboo.z * 90,
    ];
    const riverGeometry = slice(
      96,
      platformRadius + 0.5,
      angleOf('projects') - 0.06,
      angleOf('projects') + 0.06,
    );
    const dagobah = angleOf('education');
    const pools = [
      { angle: dagobah - 0.22, distance: 42, radius: 6 },
      { angle: dagobah + 0.18, distance: 62, radius: 7.5 },
      { angle: dagobah - 0.1, distance: 92, radius: 6.5 },
    ].map((p) => ({
      radius: p.radius,
      at: [
        Math.sin(p.angle) * p.distance,
        level,
        -Math.cos(p.angle) * p.distance,
      ] as [number, number, number],
    }));
    return {
      materials: [sea, lake, pool, fall],
      sea,
      lake,
      pool,
      fall,
      seaGeometry,
      riverGeometry,
      lakeAt,
      pools,
      fallAngle: angleOf('projects'),
    };
  }, []);

  useEffect(
    () => () => {
      for (const material of parts.materials) material.dispose();
      parts.seaGeometry.dispose();
      parts.riverGeometry.dispose();
    },
    [parts],
  );

  useFrame((_, delta) => {
    if (!reduced) timeUniform.value += Math.min(delta, 0.1);
  });

  const fallAt = (offset: number): [number, number, number] => {
    const a = parts.fallAngle + offset;
    return [
      Math.sin(a) * (platformRadius + 0.4),
      -17.5,
      -Math.cos(a) * (platformRadius + 0.4),
    ];
  };

  return (
    <>
      <mesh
        geometry={parts.seaGeometry}
        material={parts.sea}
        position-y={level}
      />
      <mesh
        position={parts.lakeAt}
        rotation-x={-Math.PI / 2}
        material={parts.lake}
      >
        <circleGeometry args={[14, 32]} />
      </mesh>
      <mesh
        geometry={parts.riverGeometry}
        material={parts.lake}
        position-y={level}
      />
      {parts.pools.map((pool, index) => (
        <mesh
          key={index}
          position={pool.at}
          rotation-x={-Math.PI / 2}
          material={parts.pool}
        >
          <circleGeometry args={[pool.radius, 20]} />
        </mesh>
      ))}
      {[-0.035, 0.035].map((offset) => (
        <mesh
          key={offset}
          position={fallAt(offset)}
          rotation-y={-(parts.fallAngle + offset)}
          material={parts.fall}
        >
          <planeGeometry args={[7, 36]} />
        </mesh>
      ))}
    </>
  );
}
