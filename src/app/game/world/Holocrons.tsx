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
// turning where they hide, each with a brighter core and a soft glow.
// One found flares up and vanishes. Three shapes, each drawn once for all.
const cube = new THREE.BoxGeometry(0.9, 0.9, 0.9);
const core = new THREE.OctahedronGeometry(0.42, 0);
const glow = new THREE.BoxGeometry(1.5, 1.5, 1.5);
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
const halo = new THREE.MeshBasicMaterial({
  color: '#38bdf8',
  transparent: true,
  opacity: 0.12,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const dummy = new THREE.Object3D();

export default function Holocrons() {
  const shells = useRef<THREE.InstancedMesh>(null);
  const hearts = useRef<THREE.InstancedMesh>(null);
  const halos = useRef<THREE.InstancedMesh>(null);
  const reduced = useReducedMotion();

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = reduced ? 0 : clock.elapsedTime;
    holocrons.forEach((holocron, index) => {
      let scale = 1;
      if (hunt.found.has(holocron.id)) {
        const age = (hunt.age.get(holocron.id) ?? 9) + dt;
        hunt.age.set(holocron.id, age);
        // Flares up for a moment, then is gone.
        scale = age < 0.45 ? 1 + age * 4 : 0;
      }
      dummy.position.set(
        holocron.x,
        2.6 + Math.sin(time * 1.5 + index) * 0.25,
        holocron.z,
      );
      dummy.rotation.set(0.62, time * 0.9 + index, 0.62);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      shells.current?.setMatrixAt(index, dummy.matrix);
      halos.current?.setMatrixAt(index, dummy.matrix);
      dummy.rotation.set(0, -time * 1.4 + index, 0);
      dummy.updateMatrix();
      hearts.current?.setMatrixAt(index, dummy.matrix);
    });
    for (const mesh of [shells, hearts, halos]) {
      if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
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
    </group>
  );
}
