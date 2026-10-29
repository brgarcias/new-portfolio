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
import { arena, spawn } from './world/arena';

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
};

const chase = new THREE.Vector3();
const ahead = new THREE.Vector3();

// The ship in flight: each frame it reads the controls, moves by the
// physics of physics.ts, leans into its turns, lights its engines, pulls
// the camera along behind it and places itself on the radar.
export default function Ship({ ship, onPad, onLand }: Readonly<ShipProps>) {
  const model = useMemo(() => ship.build(), [ship]);
  const rig = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
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
    const engines: THREE.MeshStandardMaterial[] = [];
    model.traverse((object) => {
      if (object.userData.engine && object instanceof THREE.Mesh) {
        engines.push(object.material as THREE.MeshStandardMaterial);
      }
    });
    flight.engines = engines;
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
    // frame's time, up to a quarter of a second, as after a tab change.
    const dt = Math.min(delta, 0.25);
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
        onLand(state.pad as SectionId);
      }
    } else {
      flight.still = 0;
    }

    const readout = overlay.hud;
    if (readout) {
      readout.dataset.x = state.x.toFixed(1);
      readout.dataset.z = state.z.toFixed(1);
      readout.dataset.heading = state.heading.toFixed(2);
      readout.dataset.speed = state.speed.toFixed(1);
    }
    overlay.radarShip?.setAttribute(
      'transform',
      `translate(${state.x.toFixed(1)} ${state.z.toFixed(1)}) rotate(${(
        (-state.heading * 180) /
        Math.PI
      ).toFixed(1)})`,
    );
  });

  return (
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
  );
}
