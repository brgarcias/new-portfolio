'use client';

// HOOKS
import { useEffect, useRef } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// GAME
import {
  followRoute,
  maxGates,
  resetRoute,
  route,
  routeStep,
  type RouteEvents,
} from '../flight-plan';
import { overlay } from '../overlay';
import { play, playGate } from '../sound';
import { telemetry } from '../telemetry';
import { useReducedMotion } from '../useMediaQuery';
// WORLD
import { padRadius, pads } from './arena';
import { groundHeight } from './terrain';

// The flight plan over the world, in the amber of the route on the
// instruments: a lane of light on the ground, with arrows running along it,
// a corridor of gates at the height the ships fly, which open as the lane
// reaches them and dissolve as the ship goes through, a column of light on
// the pad it leads to, seen from anywhere on the platform, and chevrons
// beside the ship, pointing where to turn when it faces away from all that.
// All of it is drawn from flight-plan.ts, which works the way out. Everything
// here writes the screen's colors straight, past the tone mapping, as the HUD
// does, and ignores the fog, being a projection and not part of the place.

// Half additive: bright over dark ground, and still amber over bright sand.
const hologram = {
  transparent: true,
  depthWrite: false,
  fog: false,
  side: THREE.DoubleSide,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneMinusSrcAlphaFactor,
} as const;

const amberGlsl = 'vec3(1.0, 0.749, 0.369)';

const clamp = (value: number, low = 0, high = 1) =>
  Math.min(high, Math.max(low, value));
// Water lies at this height, over the sunken ground of its sector.
const waterLevel = 0.1;
const surface = (x: number, z: number) =>
  Math.max(groundHeight(x, z), waterLevel);

// ── The lane ──────────────────────────────────────────────
const laneWidth = 2.4;
const laneLift = 0.26;
// Longer than any route: the longest, around everything, is about 230 units.
const laneCapacity = 400;

const laneGeometry = new THREE.BufferGeometry();
const lanePositions = new THREE.BufferAttribute(
  new Float32Array(laneCapacity * 2 * 3),
  3,
);
const laneAlong = new THREE.BufferAttribute(
  new Float32Array(laneCapacity * 2),
  1,
);
const laneSide = new THREE.BufferAttribute(
  new Float32Array(laneCapacity * 2),
  1,
);
laneGeometry.setAttribute('position', lanePositions);
laneGeometry.setAttribute('along', laneAlong);
laneGeometry.setAttribute('side', laneSide);
{
  const indices = new Uint16Array((laneCapacity - 1) * 6);
  for (let i = 0; i < laneCapacity - 1; i++) {
    const a = i * 2;
    indices.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6);
  }
  laneGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
}

const laneUniforms = {
  time: { value: 0 },
  drawn: { value: 0 },
  progress: { value: 0 },
  end: { value: 1 },
  total: { value: 1 },
  presence: { value: 0 },
};

const laneMaterial = new THREE.ShaderMaterial({
  ...hologram,
  uniforms: laneUniforms,
  vertexShader: /* glsl */ `
    attribute float along;
    attribute float side;
    varying float vAlong;
    varying float vSide;
    void main() {
      vAlong = along;
      vSide = side;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float time;
    uniform float drawn;
    uniform float progress;
    uniform float end;
    uniform float total;
    uniform float presence;
    varying float vAlong;
    varying float vSide;
    void main() {
      float across = abs(vSide);
      // The two rails along the edges.
      float rails = smoothstep(0.76, 0.84, across) * (1.0 - smoothstep(0.9, 1.0, across));
      // The arrows, running ahead, their points forward, sharp near the
      // ship and giving way to the rails far off, where they would shimmer.
      float phase = (vAlong + across * 1.3 - time * 9.0) / 5.0;
      float width = max(fwidth(phase), 0.001);
      float cycle = fract(phase);
      float arrow = smoothstep(0.0, width + 0.01, cycle) * (1.0 - smoothstep(0.1, 0.11 + width, cycle));
      arrow *= 1.0 - smoothstep(0.6, 0.68, across);
      float ahead = vAlong - progress;
      arrow *= 1.0 - smoothstep(38.0, 80.0, ahead);
      // A dark bed, so it reads over bright sand or snow.
      float bed = 1.0 - smoothstep(0.84, 1.0, across);
      // Only the way still to fly, and only as far as it has been drawn; the
      // tip of the drawing burns hot.
      float kept = smoothstep(-1.0, 4.0, ahead);
      float front = 1.0 - smoothstep(drawn - 1.5, drawn, vAlong);
      float tip = (drawn < total) ? exp(-abs(vAlong - drawn) * 0.5) : 0.0;
      float landing = 1.0 - smoothstep(end - 4.0, end, vAlong);
      float light = max(rails * 0.8, arrow * 0.95);
      float shown = kept * front * landing * presence;
      vec3 color = ${amberGlsl} * light + vec3(1.0, 0.92, 0.75) * tip * 0.9;
      float alpha = 0.22 * bed + light * 0.6 + tip * 0.3;
      gl_FragColor = vec4(color * shown, alpha * shown);
    }
  `,
});

// Lays the lane over the ground, along the route.
function shapeLane() {
  const count = Math.min(route.points.length, laneCapacity);
  for (let i = 0; i < count; i++) {
    const point = route.points[i];
    const before = route.points[Math.max(0, i - 1)];
    const after = route.points[Math.min(count - 1, i + 1)];
    const dx = after.x - before.x;
    const dz = after.z - before.z;
    const length = Math.hypot(dx, dz) || 1;
    const nx = (-dz / length) * (laneWidth / 2);
    const nz = (dx / length) * (laneWidth / 2);
    const y =
      Math.max(
        surface(point.x, point.z),
        surface(point.x + nx, point.z + nz),
        surface(point.x - nx, point.z - nz),
      ) + laneLift;
    lanePositions.setXYZ(i * 2, point.x + nx, y, point.z + nz);
    lanePositions.setXYZ(i * 2 + 1, point.x - nx, y, point.z - nz);
    const along = i * routeStep;
    laneAlong.setX(i * 2, along);
    laneAlong.setX(i * 2 + 1, along);
    laneSide.setX(i * 2, 1);
    laneSide.setX(i * 2 + 1, -1);
  }
  lanePositions.needsUpdate = true;
  laneAlong.needsUpdate = true;
  laneSide.needsUpdate = true;
  laneGeometry.setDrawRange(0, Math.max(0, count - 1) * 6);
}

// ── The gates ─────────────────────────────────────────────
const gateHeight = 3.3;

// A frame of thin bars: brackets at the corners with hairlines between them,
// a fainter frame behind, for depth, a soft glow rising from its foot and a
// mark at the top of its middle. Each corner of a quad carries how strong it
// is.
function makeGate() {
  const positions: number[] = [];
  const tones: number[] = [];
  const indices: number[] = [];
  const quad = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    z: number,
    low: number,
    high = low,
  ) => {
    const base = positions.length / 3;
    positions.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z);
    tones.push(low, low, high, high);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const w = 4.5;
  const h = 2.5;
  const bar = 0.15;
  const armX = 1.7;
  const armY = 1.15;
  for (const [z, tone] of [
    [1.3, 0.38],
    [0, 1],
  ]) {
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        quad(sx * w, sy * h, sx * (w - armX), sy * (h - bar), z, tone);
        quad(sx * w, sy * h, sx * (w - bar), sy * (h - armY), z, tone);
      }
    }
  }
  quad(-w + armX, h - 0.07, w - armX, h, 0, 0.34);
  quad(-w + armX, -h, w - armX, -h + 0.07, 0, 0.34);
  quad(-w, -h, w, h, 0, 0.07, 0);
  // The mark, a small wedge pointing down at the middle.
  const base = positions.length / 3;
  positions.push(-0.42, h + 0.42, 0, 0.42, h + 0.42, 0, 0, h + 0.02, 0);
  tones.push(1, 1, 1);
  indices.push(base, base + 1, base + 2);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('tone', new THREE.Float32BufferAttribute(tones, 1));
  geometry.setIndex(indices);
  return geometry;
}

const gateGeometry = makeGate();
const gateFade = new THREE.InstancedBufferAttribute(
  new Float32Array(maxGates),
  1,
);
const gateHeat = new THREE.InstancedBufferAttribute(
  new Float32Array(maxGates),
  1,
);
gateFade.setUsage(THREE.DynamicDrawUsage);
gateHeat.setUsage(THREE.DynamicDrawUsage);
gateGeometry.setAttribute('fade', gateFade);
gateGeometry.setAttribute('heat', gateHeat);

const gateMaterial = new THREE.ShaderMaterial({
  ...hologram,
  vertexShader: /* glsl */ `
    attribute float tone;
    attribute float fade;
    attribute float heat;
    varying float vLight;
    varying float vHeat;
    void main() {
      vLight = tone * fade;
      vHeat = heat;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying float vLight;
    varying float vHeat;
    void main() {
      vec3 color = mix(${amberGlsl}, vec3(1.0, 0.97, 0.88), vHeat);
      gl_FragColor = vec4(color * vLight * 1.1, vLight * 0.62);
    }
  `,
});

const dummy = new THREE.Object3D();
// A gate opening goes a little past its size and comes back.
const overshoot = (t: number) => {
  const u = t - 1;
  return 1 + 2.7 * u * u * u + 1.7 * u * u;
};
const passTime = 0.5;

function placeGates(mesh: THREE.InstancedMesh, time: number, reduced: boolean) {
  const { gates } = route;
  // The next gate breathes, for the eye to go to it.
  const next = gates.findIndex((gate) => gate.age < 0);
  const count = Math.min(gates.length, maxGates);
  for (let i = 0; i < count; i++) {
    const gate = gates[i];
    const opening = reduced ? 1 : clamp((route.drawn - gate.along) / 10);
    let size = opening > 0 ? overshoot(opening) : 0;
    let fade = 0;
    let heat = 0;
    if (gate.age >= 0) {
      const t = gate.age / passTime;
      if (t < 1 && !reduced) {
        size = 1 + t * t * 0.9;
        fade = (1 - t) * (1 - t);
        heat = 1 - t;
      } else {
        size = 0;
      }
    } else if (opening > 0) {
      const ahead = gate.along - route.progress;
      fade = 0.3 + 0.7 * clamp(1 - (ahead - 12) / 70);
      heat = (1 - opening) * 0.9;
      if (i === next && !reduced) {
        fade = Math.max(fade, 0.72 + 0.28 * Math.sin(time * 5));
      }
    }
    dummy.position.set(gate.x, surface(gate.x, gate.z) + gateHeight, gate.z);
    dummy.rotation.set(0, gate.heading, 0);
    dummy.scale.set(size * gate.width, size, size || 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    gateFade.setX(i, fade * route.presence);
    gateHeat.setX(i, heat);
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
  gateFade.needsUpdate = true;
  gateHeat.needsUpdate = true;
}

// ── The column on the pad ─────────────────────────────────
const columnHeight = 130;
const columnGeometry = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true);
columnGeometry.translate(0, 0.5, 0);

const columnUniforms = {
  time: { value: 0 },
  risen: { value: 0 },
  fade: { value: 0 },
};

// Brightest along its axis and fading to nothing at its sides, whatever the
// angle, as a beam of light in the air looks.
const columnMaterial = new THREE.ShaderMaterial({
  ...hologram,
  uniforms: columnUniforms,
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vToEye;
    varying float vHeight;
    void main() {
      vec4 view = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalMatrix * normal;
      vToEye = -view.xyz;
      vHeight = position.y;
      gl_Position = projectionMatrix * view;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float time;
    uniform float risen;
    uniform float fade;
    varying vec3 vNormal;
    varying vec3 vToEye;
    varying float vHeight;
    void main() {
      float facing = abs(dot(normalize(vNormal), normalize(vToEye)));
      float body = pow(facing, 3.0);
      float core = pow(facing, 20.0);
      float rise = max(risen, 0.001);
      float tip = 1.0 - smoothstep(rise * 0.7, rise, vHeight);
      float falling = pow(1.0 - vHeight, 3.0);
      float units = vHeight * ${columnHeight.toFixed(1)};
      float bands = 0.82 + 0.18 * sin((units / 6.5 - time * 0.9) * 6.2832);
      float foot = 1.0 + 1.2 * exp(-units * 0.14);
      float light = tip * falling * bands * foot * fade;
      vec3 color = ${amberGlsl} * body * 0.62 + vec3(1.0, 0.95, 0.82) * core * 0.42;
      gl_FragColor = vec4(color * light, 0.0);
    }
  `,
});

// ── The ripples around the pad ────────────────────────────
const ripplesRadius = padRadius + 7;
const ripplesGeometry = new THREE.CircleGeometry(1, 64);
ripplesGeometry.rotateX(-Math.PI / 2);

const ripplesUniforms = {
  time: { value: 0 },
  fade: { value: 0 },
};

const ripplesMaterial = new THREE.ShaderMaterial({
  ...hologram,
  uniforms: ripplesUniforms,
  vertexShader: /* glsl */ `
    varying vec2 vSpot;
    void main() {
      vSpot = position.xz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float time;
    uniform float fade;
    varying vec2 vSpot;
    void main() {
      float r = length(vSpot);
      float cycle = fract(r * 1.5 - time * 0.42);
      float wave = smoothstep(0.72, 0.97, cycle) * (1.0 - smoothstep(0.97, 1.0, cycle));
      wave *= smoothstep(0.08, 0.3, r) * (1.0 - smoothstep(0.7, 1.0, r));
      float edge = ${(padRadius / ripplesRadius).toFixed(3)};
      float ring = smoothstep(edge - 0.035, edge - 0.012, r) * (1.0 - smoothstep(edge + 0.012, edge + 0.035, r));
      float light = (wave * 0.6 + ring) * fade;
      gl_FragColor = vec4(${amberGlsl} * light, light * 0.6);
    }
  `,
});

// ── The chevrons beside the ship ──────────────────────────
function makeGuide() {
  const positions: number[] = [];
  const ranks: number[] = [];
  const indices: number[] = [];
  for (let rank = 0; rank < 3; rank++) {
    const tip = -1.4 - rank * 1.55;
    const back = tip + 0.95;
    const thick = 0.46;
    const wing = 1.05;
    for (const sx of [-1, 1]) {
      const base = positions.length / 3;
      positions.push(
        0,
        0,
        tip,
        sx * wing,
        0,
        back,
        sx * wing,
        0,
        back + thick,
        0,
        0,
        tip + thick,
      );
      ranks.push(rank, rank, rank, rank);
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('rank', new THREE.Float32BufferAttribute(ranks, 1));
  geometry.setIndex(indices);
  return geometry;
}

const guideGeometry = makeGuide();
const guideUniforms = {
  time: { value: 0 },
  fade: { value: 0 },
};

const guideMaterial = new THREE.ShaderMaterial({
  ...hologram,
  uniforms: guideUniforms,
  vertexShader: /* glsl */ `
    attribute float rank;
    varying float vRank;
    void main() {
      vRank = rank;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float time;
    uniform float fade;
    varying float vRank;
    void main() {
      float wave = 0.5 + 0.5 * sin(time * 6.0 - vRank * 1.5);
      float light = (0.4 + 0.6 * wave) * fade;
      gl_FragColor = vec4(${amberGlsl} * light, light * 0.7);
    }
  `,
});

const wrapPi = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
const guideReach = 11;
const guideTurn = 1.95;

function placeGuide(guide: THREE.Mesh, aspect: number) {
  const target =
    route.points[Math.min(route.points.length - 1, route.index + guideReach)];
  const dx = target.x - telemetry.x;
  const dz = target.z - telemetry.z;
  const away = Math.hypot(dx, dz);
  const turn = wrapPi(Math.atan2(-dx, -dz) - telemetry.heading);
  const clamped = clamp(turn, -guideTurn, guideTurn);
  const heading = telemetry.heading + clamped;
  // Ahead of the ship's nose and out to the side it must turn to; closer in
  // on a phone standing up, whose picture is narrow.
  const narrow = aspect < 1 ? 0.62 : 1;
  guide.position.set(
    telemetry.x - Math.sin(telemetry.heading) * 3 - Math.sin(heading) * 1.4,
    surface(telemetry.x, telemetry.z) + 1,
    telemetry.z - Math.cos(telemetry.heading) * 3 - Math.cos(heading) * 1.4,
  );
  guide.rotation.y = heading;
  guide.scale.setScalar(narrow);
  guideUniforms.fade.value =
    route.presence *
    clamp((Math.abs(turn) - 0.9) / 0.5) *
    clamp((away - 3) / 6) *
    clamp(route.drawn / 12);
}

const events: RouteEvents = {
  onGate: playGate,
  onPlot: () => play('route'),
  onRecalculate: () => play('recalculate'),
};

interface CourseProps {
  // Whether a dialog covers the flight, so the route waits to draw itself.
  held: boolean;
  // Photo mode leaves only the world in the picture.
  photo: boolean;
  // The cruising speed of the ship, for the time left on the instruments.
  cruise: number;
}

let shaped = -1;
let clock = 0;
let padDistance = 0;

// Mounted after the ship, so it reads where the ship is this frame.
export default function Course({ held, photo, cruise }: Readonly<CourseProps>) {
  const reduced = useReducedMotion();
  const root = useRef<THREE.Group>(null);
  const gates = useRef<THREE.InstancedMesh>(null);
  const column = useRef<THREE.Mesh>(null);
  const ripples = useRef<THREE.Mesh>(null);
  const guide = useRef<THREE.Mesh>(null);

  // A new flight plots its route again from where the ship now is.
  useEffect(() => {
    resetRoute();
  }, []);

  useFrame(({ size }, delta) => {
    const dt = Math.min(delta, 0.1);
    route.cruise = cruise;
    // It also waits for the arrival from hyperspace, on a flight that starts
    // with a course set.
    const arriving = overlay.hud?.dataset.arriving !== undefined;
    followRoute(
      telemetry.x,
      telemetry.z,
      dt,
      { reduced, held: held || arriving },
      events,
    );
    const group = root.current;
    if (!group) return;
    const showing = route.presence > 0 && !photo;
    group.visible = showing;
    if (!showing) return;
    if (shaped !== route.version) {
      shaped = route.version;
      shapeLane();
    }
    if (!reduced) clock += dt;

    laneUniforms.time.value = clock;
    laneUniforms.drawn.value = route.drawn;
    laneUniforms.progress.value = route.progress;
    laneUniforms.total.value = route.length;
    laneUniforms.end.value = route.length - padRadius + 2;
    laneUniforms.presence.value = route.presence;

    if (gates.current) placeGates(gates.current, clock, reduced);

    // The column and the ripples stand on the pad; the column gives way as
    // the ship comes in, not to burn out the landing.
    const pad = pads.find((landing) => landing.id === route.id);
    if (pad) {
      padDistance = Math.hypot(pad.x - telemetry.x, pad.z - telemetry.z);
      column.current?.position.set(pad.x, 0, pad.z);
      ripples.current?.position.set(pad.x, 0.46, pad.z);
    }
    columnUniforms.time.value = clock;
    columnUniforms.risen.value = 1 - (1 - route.risen) * (1 - route.risen);
    columnUniforms.fade.value =
      route.presence * (0.25 + 0.75 * clamp((padDistance - 10) / 24));
    ripplesUniforms.time.value = clock;
    ripplesUniforms.fade.value = route.presence * route.risen;

    if (guide.current) {
      guideUniforms.time.value = clock;
      placeGuide(guide.current, size.width / Math.max(1, size.height));
    }
  });

  return (
    <group ref={root} visible={false}>
      <mesh
        geometry={laneGeometry}
        material={laneMaterial}
        frustumCulled={false}
        renderOrder={5}
      />
      <instancedMesh
        ref={gates}
        args={[gateGeometry, gateMaterial, maxGates]}
        frustumCulled={false}
        renderOrder={6}
      />
      <mesh
        ref={column}
        geometry={columnGeometry}
        material={columnMaterial}
        scale={[1.25, columnHeight, 1.25]}
        frustumCulled={false}
        renderOrder={6}
      />
      <mesh
        ref={ripples}
        geometry={ripplesGeometry}
        material={ripplesMaterial}
        scale={[ripplesRadius, 1, ripplesRadius]}
        frustumCulled={false}
        renderOrder={5}
      />
      <mesh
        ref={guide}
        geometry={guideGeometry}
        material={guideMaterial}
        frustumCulled={false}
        renderOrder={6}
      />
    </group>
  );
}
