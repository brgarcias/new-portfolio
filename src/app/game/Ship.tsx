'use client';

// HOOKS
import { useEffect, useMemo, useRef } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { readInput } from './controls';
import { hunt } from './hunt';
import { hum, play } from './sound';
import { updateInstruments } from './instruments';
import { overlay } from './overlay';
import { createState, step } from './physics';
import { resetTelemetry, telemetry } from './telemetry';
import type { Ship as ShipSpec } from './ships';
import { useReducedMotion } from './useMediaQuery';
import { arena, holocrons, padRadius, spawn } from './world/arena';
import { atmosphere, sectorAt, type Sector } from './world/biomes';

interface ShipProps {
  ship: ShipSpec;
  // Called when the ship enters or leaves a landing pad, and when it
  // stops on one.
  onPad: (pad: SectionId | null) => void;
  onLand: (pad: SectionId) => void;
  // Called when the ship flies through a holocron.
  onCollect: (id: SectionId) => void;
}

// The flight in progress, which the frame loop reads and writes: the ship's
// state and the materials of its engines, which brighten as it accelerates.
const flight = {
  state: createState(),
  engines: [] as THREE.MeshStandardMaterial[],
  flames: [] as THREE.Mesh[],
  pad: null as string | null,
  // The pad the ship landed on, and for how long it has been still.
  landed: null as string | null,
  still: 0,
  // How much the camera shakes, after a hit.
  shake: 0,
  clock: 0,
  // The sector of the world the ship is over.
  sector: 'hub' as Sector,
  // The ring that spreads over a pad when the ship lands on it.
  pulse: { x: 0, z: 0, age: 9 },
  // The burst of light when the last holocron is found: where, and how
  // long ago, or less than zero for none.
  party: { x: 0, y: 0, z: 0, age: -1 },
};

// The burst: sparks thrown from the ship, in gold and blue, that rise,
// fall and fade; the shader moves them with the time since the burst.
const sparkCount = 220;
function makeSparks() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(sparkCount * 3);
  const velocities = new Float32Array(sparkCount * 3);
  const seeds = new Float32Array(sparkCount);
  for (let i = 0; i < sparkCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const lift = Math.random() * 0.9 + 0.1;
    const speed = 4 + Math.random() * 9;
    const flat = Math.sqrt(1 - lift * lift);
    velocities[i * 3] = Math.cos(theta) * flat * speed;
    velocities[i * 3 + 1] = lift * speed + 3;
    velocities[i * 3 + 2] = Math.sin(theta) * flat * speed;
    seeds[i] = Math.random();
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return geometry;
}
const sparkGeometry = makeSparks();
const sparkMaterial = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, origin: { value: new THREE.Vector3() } },
  vertexShader: /* glsl */ `
    uniform float time;
    uniform vec3 origin;
    attribute vec3 velocity;
    attribute float seed;
    varying float vLife;
    varying float vSeed;
    void main() {
      float t = time;
      vec3 p = origin + velocity * t + vec3(0.0, -3.2 * t * t, 0.0);
      vLife = clamp(1.0 - t / 3.2, 0.0, 1.0);
      vSeed = seed;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp((0.9 + 0.9 * seed) * (300.0 / -mvPosition.z) * (0.4 + 0.6 * vLife), 2.0, 26.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: /* glsl */ `
    varying float vLife;
    varying float vSeed;
    void main() {
      vec2 d = gl_PointCoord - 0.5;
      float d2 = dot(d, d);
      if (d2 > 0.25) discard;
      // A bright core in a softer disc.
      float core = 1.0 - smoothstep(0.0, 0.25, d2);
      vec3 gold = vec3(1.0, 0.78, 0.3);
      vec3 blue = vec3(0.45, 0.85, 1.0);
      vec3 tint = mix(gold, blue, step(0.5, vSeed));
      gl_FragColor = vec4(mix(tint, vec3(1.0), core * 0.55), vLife * (0.5 + 0.5 * core));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
  transparent: true,
  depthWrite: false,
});

// The trail behind the ship: the last positions of its two sides, newest
// first, which draw as two ribbons that fade with age.
const trailLength = 28;
const trail = {
  left: new Float32Array(trailLength * 2),
  right: new Float32Array(trailLength * 2),
  filled: 0,
};

function makeTrail() {
  const geometry = new THREE.BufferGeometry();
  const vertices = trailLength * 4;
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array(vertices * 3), 3),
  );
  geometry.setAttribute(
    'color',
    new THREE.BufferAttribute(new Float32Array(vertices * 3), 3),
  );
  const indices: number[] = [];
  for (const strip of [0, 1]) {
    const base = strip * trailLength * 2;
    for (let i = 0; i < trailLength - 1; i++) {
      const a = base + i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  geometry.setIndex(indices);
  // The ribbons move every frame, so the bounds are left to the frame.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return geometry;
}

// Writes one ribbon's vertices from its stored points.
function ribbon(
  positions: THREE.BufferAttribute,
  points: Float32Array,
  base: number,
  y: number,
) {
  for (let i = 0; i < trailLength; i++) {
    const x = points[i * 2];
    const z = points[i * 2 + 1];
    const before = Math.max(0, i - 1);
    const after = Math.min(trailLength - 1, i + 1);
    let dx = points[before * 2] - points[after * 2];
    let dz = points[before * 2 + 1] - points[after * 2 + 1];
    const length = Math.hypot(dx, dz) || 1;
    dx /= length;
    dz /= length;
    const width = 0.06 + 0.42 * (1 - i / (trailLength - 1));
    positions.setXYZ(base + i * 2, x - dz * width, y, z + dx * width);
    positions.setXYZ(base + i * 2 + 1, x + dz * width, y, z - dx * width);
  }
}

const chase = new THREE.Vector3();
const ahead = new THREE.Vector3();
const trailColor = new THREE.Color();

// The flames of the engines: cones behind each engine's mouth, an outer
// one in fire and an inner one in white heat, that lengthen with the
// thrust and the boost and flicker.
const flameGeometry = new THREE.ConeGeometry(1, 1, 8, 1, true);
flameGeometry.translate(0, 0.5, 0);
flameGeometry.rotateX(Math.PI / 2);
const outerFlame = new THREE.MeshBasicMaterial({
  color: '#ff6a2a',
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const innerFlame = new THREE.MeshBasicMaterial({
  color: '#fff1b0',
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
});

// The wind under boost: streaks around the ship, in its own space, that
// rush past it and wrap around.
const windCount = 40;
function makeWind() {
  const positions = new Float32Array(windCount * 6);
  for (let i = 0; i < windCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.random() * 3.5;
    const z = -12 + Math.random() * 20;
    const length = 2 + Math.random() * 2;
    positions.set(
      [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        z,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        z + length,
      ],
      i * 6,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
}
const windGeometry = makeWind();
const windMaterial = new THREE.LineBasicMaterial({
  color: '#8f9bff',
  transparent: true,
  opacity: 0,
  depthWrite: false,
});
const trailGeometry = makeTrail();
const trailMaterial = new THREE.MeshBasicMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
});

// The ship in flight: each frame it reads the controls, moves by the
// physics of physics.ts, leans into its turns, lights its engines, pulls
// the camera along behind it and places itself on the radar.
export default function Ship({
  ship,
  onPad,
  onLand,
  onCollect,
}: Readonly<ShipProps>) {
  const model = useMemo(() => ship.build(), [ship]);
  const rig = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const trailMesh = useRef<THREE.Mesh>(null);
  const pulseMesh = useRef<THREE.Mesh>(null);
  const wind = useRef<THREE.LineSegments>(null);
  const sparks = useRef<THREE.Points>(null);
  const reduced = useReducedMotion();

  // A new ship starts again from the hangar's spot. Its shapes are freed
  // when it leaves; the materials are shared, except the engines' own.
  useEffect(() => {
    flight.state = createState(spawn.x, spawn.z, spawn.heading);
    flight.pad = null;
    flight.landed = null;
    flight.still = 0;
    flight.shake = 0;
    flight.clock = 0;
    flight.sector = 'hub';
    atmosphere.sector = 'hub';
    resetTelemetry();
    flight.pulse.age = 9;
    trail.filled = 0;
    const engines: THREE.MeshStandardMaterial[] = [];
    const flames: THREE.Mesh[] = [];
    model.traverse((object) => {
      if (object.userData.engine && object instanceof THREE.Mesh) {
        engines.push(object.material as THREE.MeshStandardMaterial);
        // A flame behind each engine, sized to its mouth.
        const mouth =
          (object.geometry as THREE.CylinderGeometry).parameters?.radiusTop ??
          0.3;
        const outer = new THREE.Mesh(flameGeometry, outerFlame);
        outer.scale.set(mouth * 1.05, mouth * 1.05, 1);
        outer.position.z = 0.06;
        outer.visible = false;
        const inner = new THREE.Mesh(flameGeometry, innerFlame);
        inner.scale.set(mouth * 0.55, mouth * 0.55, 0.7);
        inner.position.z = 0.06;
        inner.visible = false;
        inner.userData.inner = true;
        object.add(outer, inner);
        flames.push(outer, inner);
      }
    });
    flight.engines = engines;
    flight.flames = flames;
    // The trail takes the color of the engines, fading with age.
    trailColor.set(engines[0]?.emissive ?? '#8f8fff');
    const colors = trailGeometry.attributes.color as THREE.BufferAttribute;
    for (let strip = 0; strip < 2; strip++) {
      for (let i = 0; i < trailLength; i++) {
        const fade = Math.pow(1 - i / (trailLength - 1), 1.6);
        const k = strip * trailLength * 2 + i * 2;
        colors.setXYZ(
          k,
          trailColor.r * fade,
          trailColor.g * fade,
          trailColor.b * fade,
        );
        colors.setXYZ(
          k + 1,
          trailColor.r * fade,
          trailColor.g * fade,
          trailColor.b * fade,
        );
      }
    }
    colors.needsUpdate = true;
    return () => {
      flight.engines = [];
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.userData.engine) {
            (object.material as THREE.Material).dispose();
          }
        }
      });
    };
  }, [model]);

  useFrame(({ camera }, delta) => {
    // Slow frames, as on a weak machine or a software renderer, do not slow
    // the ship down: the physics runs in short steps that add up to the
    // frame's time, up to a second, as after a tab change.
    const dt = Math.min(delta, 1);
    const { state } = flight;
    flight.clock += dt;
    const controls = readInput();
    let hit = 0;
    for (let left = dt; left > 0; left -= 1 / 60) {
      step(state, controls, ship.handling, arena, Math.min(left, 1 / 60));
      hit = Math.max(hit, state.hit);
    }

    const hull = rig.current;
    const frame = body.current;
    if (!hull || !frame) return;
    hull.position.set(state.x, ship.hover, state.z);
    hull.rotation.y = state.heading;

    // Banks into the turns, dips its nose as it accelerates, bobs while it
    // hovers.
    const grip = Math.min(1, state.speed / 10);
    const bank = -Math.max(-1, Math.min(1, controls.turn)) * grip * 0.55;
    const boosting = controls.boost && controls.thrust > 0;
    let pitch = 0;
    if (controls.thrust > 0) pitch = boosting ? -0.1 : -0.06;
    else if (controls.thrust < 0) pitch = 0.08;
    frame.rotation.z += (bank - frame.rotation.z) * (1 - Math.exp(-6 * dt));
    frame.rotation.x += (pitch - frame.rotation.x) * (1 - Math.exp(-4 * dt));
    frame.position.y = reduced ? 0 : Math.sin(flight.clock * 2.1) * 0.12;

    const glow =
      0.6 + Math.max(0, controls.thrust) * 1.4 + (boosting ? 1.2 : 0);
    for (const material of flight.engines) material.emissiveIntensity = glow;
    hum(controls.thrust, boosting, state.speed);
    if (hit > 4) play('bump');
    // Fire from the engines with the thrust, longer under boost.
    const firing = controls.thrust > 0;
    const length = 1.2 + 1.6 * controls.thrust + (boosting ? 3.6 : 0);
    const flicker = reduced ? 1 : 0.82 + 0.36 * Math.random();
    for (const flame of flight.flames) {
      flame.visible = firing;
      if (firing) {
        flame.scale.z = length * flicker * (flame.userData.inner ? 0.7 : 1);
      }
    }
    // The wind rushes past under boost.
    const streaks = wind.current;
    if (streaks) {
      const target = boosting && !reduced ? 0.5 : 0;
      windMaterial.opacity +=
        (target - windMaterial.opacity) * (1 - Math.exp(-6 * dt));
      streaks.visible = windMaterial.opacity > 0.02;
      if (streaks.visible) {
        const positions = windGeometry.attributes
          .position as THREE.BufferAttribute;
        for (let i = 0; i < windCount; i++) {
          let z = positions.getZ(i * 2) + 60 * dt;
          let tail = positions.getZ(i * 2 + 1) + 60 * dt;
          if (z > 10) {
            z -= 22;
            tail -= 22;
          }
          positions.setZ(i * 2, z);
          positions.setZ(i * 2 + 1, tail);
        }
        positions.needsUpdate = true;
      }
    }

    // The camera follows from behind and above, further back at speed, and
    // shakes after a hit.
    const fx = -Math.sin(state.heading);
    const fz = -Math.cos(state.heading);
    const back = 11 + state.speed * 0.12;
    const up = 5 + state.speed * 0.03;
    chase.set(state.x - fx * back, ship.hover + up, state.z - fz * back);
    camera.position.lerp(chase, reduced ? 1 : 1 - Math.exp(-5 * dt));
    flight.shake = Math.max(
      flight.shake * Math.exp(-6 * dt),
      Math.min(1, hit / 12),
    );
    if (!reduced && flight.shake > 0.01) {
      camera.position.x += (Math.random() - 0.5) * flight.shake * 1.2;
      camera.position.y += (Math.random() - 0.5) * flight.shake * 0.8;
    }
    ahead.set(state.x + fx * 5, ship.hover + 1, state.z + fz * 5);
    camera.lookAt(ahead);
    // The view widens a little under boost.
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = boosting && !reduced ? 62 : 55;
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov += (fov - camera.fov) * (1 - Math.exp(-4 * dt));
        camera.updateProjectionMatrix();
      }
    }

    // The trail: the sides of the ship, this frame, go to the front of the
    // ribbons, which show with speed.
    const rx = Math.cos(state.heading);
    const rz = -Math.sin(state.heading);
    const spread = ship.handling.radius * 0.45;
    trail.left.copyWithin(2, 0, trailLength * 2 - 2);
    trail.right.copyWithin(2, 0, trailLength * 2 - 2);
    trail.left[0] = state.x + rx * spread;
    trail.left[1] = state.z + rz * spread;
    trail.right[0] = state.x - rx * spread;
    trail.right[1] = state.z - rz * spread;
    trail.filled = Math.min(trailLength, trail.filled + 1);
    const ribbons = trailMesh.current;
    if (ribbons) {
      const show = !reduced && trail.filled >= trailLength && state.speed > 3;
      ribbons.visible = show;
      if (show) {
        const positions = trailGeometry.attributes
          .position as THREE.BufferAttribute;
        ribbon(positions, trail.left, 0, ship.hover - 0.2);
        ribbon(positions, trail.right, trailLength * 2, ship.hover - 0.2);
        positions.needsUpdate = true;
        trailMaterial.opacity = Math.min(0.85, (state.speed - 3) / 12);
      }
    }
    // The sparks of the last holocron.
    const burst = sparks.current;
    if (burst) {
      if (flight.party.age >= 0) flight.party.age += dt;
      const alive = !reduced && flight.party.age >= 0 && flight.party.age < 3.4;
      burst.visible = alive;
      if (alive) {
        sparkMaterial.uniforms.time.value = flight.party.age;
        (sparkMaterial.uniforms.origin.value as THREE.Vector3).set(
          flight.party.x,
          flight.party.y,
          flight.party.z,
        );
      }
    }
    // The ring that spreads over the pad on landing.
    const ring = pulseMesh.current;
    if (ring) {
      flight.pulse.age += dt;
      const alive = flight.pulse.age < 0.9;
      ring.visible = alive;
      if (alive) {
        ring.position.set(flight.pulse.x, 0.42, flight.pulse.z);
        ring.scale.setScalar(1 + flight.pulse.age * 1.4);
        (ring.material as THREE.MeshBasicMaterial).opacity =
          0.7 * (1 - flight.pulse.age / 0.9);
      }
    }

    // A holocron within reach is found.
    for (const holocron of holocrons) {
      if (hunt.found.has(holocron.id)) continue;
      if (Math.hypot(state.x - holocron.x, state.z - holocron.z) < 3.5) {
        hunt.found.add(holocron.id);
        hunt.age.set(holocron.id, 0);
        onCollect(holocron.id);
        if (hunt.found.size >= holocrons.length) {
          // The last one: a burst of sparks from the ship.
          flight.party = { x: state.x, y: ship.hover, z: state.z, age: 0 };
          play('party');
        } else {
          play('holocron');
        }
      }
    }

    if (state.pad !== flight.pad) {
      flight.pad = state.pad;
      onPad(state.pad as SectionId | null);
    }
    // Stopped on a pad for a moment, the ship lands there, once per visit
    // to the pad: it has to leave and come back to land again.
    if (!state.pad) flight.landed = null;
    if (state.pad && state.pad !== flight.landed && state.speed < 1.5) {
      flight.still += dt;
      if (flight.still > 0.5) {
        flight.landed = state.pad;
        play('land');
        const spot = arena.pads.find((pad) => pad.id === state.pad);
        if (spot) {
          flight.pulse.x = spot.x;
          flight.pulse.z = spot.z;
          flight.pulse.age = 0;
        }
        onLand(state.pad as SectionId);
      }
    } else {
      flight.still = 0;
    }

    const readout = overlay.hud;
    // Crossing into another sector, the sky follows and the HUD names the
    // planet.
    const sector = sectorAt(state.x, state.z);
    if (sector !== flight.sector) {
      flight.sector = sector;
      atmosphere.sector = sector;
      if (readout) {
        readout.dataset.sector = sector;
        for (const chip of readout.querySelectorAll<HTMLElement>(
          '.hud__planet',
        )) {
          chip.hidden = chip.dataset.id !== sector;
        }
      }
    }
    if (readout) {
      readout.dataset.x = state.x.toFixed(1);
      readout.dataset.z = state.z.toFixed(1);
      readout.dataset.heading = state.heading.toFixed(2);
      readout.dataset.speed = state.speed.toFixed(1);
      readout.dataset.time = flight.clock.toFixed(1);
      readout.dataset.pad = state.pad ?? '';
    }
    // What the instruments read, and the instruments themselves.
    telemetry.x = state.x;
    telemetry.z = state.z;
    telemetry.heading = state.heading;
    telemetry.speed = state.speed;
    telemetry.boost = boosting;
    telemetry.sector = flight.sector;
    telemetry.pad = state.pad as SectionId | null;
    telemetry.landed = Boolean(state.pad && flight.landed === state.pad);
    telemetry.landing = telemetry.landed
      ? 1
      : state.pad
        ? Math.min(1, flight.still / 0.5)
        : 0;
    updateInstruments(dt);
  });

  return (
    <>
      <group ref={rig}>
        <group ref={body}>
          <primitive object={model} />
        </group>
        <lineSegments
          ref={wind}
          geometry={windGeometry}
          material={windMaterial}
          visible={false}
          frustumCulled={false}
        />
        {/* Its shadow on the deck, and the light of its engines. */}
        <mesh rotation-x={-Math.PI / 2} position-y={-ship.hover + 0.06}>
          <circleGeometry args={[ship.handling.radius * 0.9, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.35} />
        </mesh>
        <pointLight
          position={[0, 0.5, 2.5]}
          intensity={18}
          distance={16}
          color="#8f8fff"
        />
      </group>
      <mesh
        ref={trailMesh}
        geometry={trailGeometry}
        material={trailMaterial}
        visible={false}
        frustumCulled={false}
      />
      <points
        ref={sparks}
        geometry={sparkGeometry}
        material={sparkMaterial}
        visible={false}
        frustumCulled={false}
      />
      <mesh ref={pulseMesh} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[padRadius - 1.2, padRadius, 48]} />
        <meshBasicMaterial
          color="#c4c5ff"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
