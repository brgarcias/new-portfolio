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
import { overlay } from './overlay';
import { createState, step } from './physics';
import type { Ship as ShipSpec } from './ships';
import { useReducedMotion } from './useMediaQuery';
import { arena, padRadius, spawn } from './world/arena';
import { atmosphere, sectorAt, type Sector } from './world/biomes';

interface ShipProps {
  ship: ShipSpec;
  // Called when the ship enters or leaves a landing pad, and when it
  // stops on one.
  onPad: (pad: SectionId | null) => void;
  onLand: (pad: SectionId) => void;
}

// The flight in progress, which the frame loop reads and writes: the ship's
// state and the materials of its engines, which brighten as it accelerates.
const flight = {
  state: createState(),
  engines: [] as THREE.MeshStandardMaterial[],
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
};

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
export default function Ship({ ship, onPad, onLand }: Readonly<ShipProps>) {
  const model = useMemo(() => ship.build(), [ship]);
  const rig = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const trailMesh = useRef<THREE.Mesh>(null);
  const pulseMesh = useRef<THREE.Mesh>(null);
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
    flight.pulse.age = 9;
    trail.filled = 0;
    const engines: THREE.MeshStandardMaterial[] = [];
    model.traverse((object) => {
      if (object.userData.engine && object instanceof THREE.Mesh) {
        engines.push(object.material as THREE.MeshStandardMaterial);
      }
    });
    flight.engines = engines;
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
    }
    const marker = `translate(${state.x.toFixed(1)} ${state.z.toFixed(1)}) rotate(${(
      (-state.heading * 180) /
      Math.PI
    ).toFixed(1)})`;
    overlay.radarShip?.setAttribute('transform', marker);
    overlay.mapShip?.setAttribute('transform', marker);
  });

  return (
    <>
      <group ref={rig}>
        <group ref={body}>
          <primitive object={model} />
        </group>
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
