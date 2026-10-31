'use client';

// HOOKS
import { useRef } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// GAME
import { hunt } from '../hunt';
import { useReducedMotion } from '../useMediaQuery';
import { holocrons } from './arena';

// The holocrons: cubes of blue light standing on a corner, floating and
// turning where they hide, each with a brighter core and a soft glow, and
// a faint beam of light above it, so it can be spotted from afar. One
// found flares up and vanishes, and a ring of light spreads from it. Each
// shape is drawn once for all seven.
const cube = new THREE.BoxGeometry(0.9, 0.9, 0.9);
const core = new THREE.OctahedronGeometry(0.42, 0);
const glow = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const beam = new THREE.CylinderGeometry(0.05, 0.16, 18, 6, 1, true);
beam.translate(0, 12, 0);
const ring = new THREE.RingGeometry(1.9, 2.1, 40);
ring.rotateX(-Math.PI / 2);
const shell = new THREE.MeshStandardMaterial({
  color: '#123547',
  emissive: '#38bdf8',
  emissiveIntensity: 1.1,
  transparent: true,
  opacity: 0.92,
  roughness: 0.3,
  metalness: 0.2,
});
const heart = new THREE.MeshBasicMaterial({ color: '#d7f7ff' });
const additive = {
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
};
const halo = new THREE.MeshBasicMaterial({
  ...additive,
  color: '#38bdf8',
  opacity: 0.12,
});
const light = new THREE.MeshBasicMaterial({
  ...additive,
  color: '#7fe3ff',
  opacity: 0.22,
  side: THREE.DoubleSide,
});
// The rings fade by their color, which adds nothing once it is black.
const wave = new THREE.MeshBasicMaterial({ ...additive, color: '#ffffff' });
const dummy = new THREE.Object3D();
const tint = new THREE.Color();
const blue = new THREE.Color('#7fe3ff');

export default function Holocrons() {
  const shells = useRef<THREE.InstancedMesh>(null);
  const hearts = useRef<THREE.InstancedMesh>(null);
  const halos = useRef<THREE.InstancedMesh>(null);
  const beams = useRef<THREE.InstancedMesh>(null);
  const waves = useRef<THREE.InstancedMesh>(null);
  const reduced = useReducedMotion();

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = reduced ? 0 : clock.elapsedTime;
    holocrons.forEach((holocron, index) => {
      const found = hunt.found.has(holocron.id);
      let scale = 1;
      let age = 9;
      if (found) {
        age = (hunt.age.get(holocron.id) ?? 9) + dt;
        hunt.age.set(holocron.id, age);
        // Flares up for a moment, then is gone: small and quick, so it
        // never fills the view as the camera passes it.
        scale = age < 0.3 ? 1 + age * 2.2 : 0;
      }
      const y = 2.6 + Math.sin(time * 1.5 + index) * 0.25;
      dummy.position.set(holocron.x, y, holocron.z);
      dummy.rotation.set(0.62, time * 0.9 + index, 0.62);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      shells.current?.setMatrixAt(index, dummy.matrix);
      halos.current?.setMatrixAt(index, dummy.matrix);
      dummy.rotation.set(0, -time * 1.4 + index, 0);
      dummy.updateMatrix();
      hearts.current?.setMatrixAt(index, dummy.matrix);
      // The beam, while it hides.
      dummy.position.set(holocron.x, 0, holocron.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, found ? 0 : 1, 1);
      dummy.updateMatrix();
      beams.current?.setMatrixAt(index, dummy.matrix);
      // The ring, the moment it is found.
      const spreading = !reduced && age < 0.9;
      dummy.position.set(holocron.x, 0.4, holocron.z);
      dummy.scale.setScalar(spreading ? 1 + age * 3.5 : 0);
      dummy.updateMatrix();
      waves.current?.setMatrixAt(index, dummy.matrix);
      if (spreading) {
        waves.current?.setColorAt(
          index,
          tint.copy(blue).multiplyScalar(0.35 * (1 - age / 0.9)),
        );
      }
    });
    for (const mesh of [shells, hearts, halos, beams, waves]) {
      if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    }
    if (waves.current?.instanceColor) {
      waves.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={shells}
        args={[cube, shell, holocrons.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={hearts}
        args={[core, heart, holocrons.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={halos}
        args={[glow, halo, holocrons.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={beams}
        args={[beam, light, holocrons.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={waves}
        args={[ring, wave, holocrons.length]}
        frustumCulled={false}
      />
    </group>
  );
}
