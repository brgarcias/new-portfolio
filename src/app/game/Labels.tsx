'use client';

// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// GAME
import { overlay } from './overlay';
import { pads } from './world/arena';

const point = new THREE.Vector3();

// Keeps the names of the pads, which are HTML over the canvas, above their
// pads on screen, fading with the distance.
export default function Labels() {
  useFrame(({ camera, size }) => {
    const labels = overlay.labels?.children;
    if (!labels) return;
    pads.forEach((pad, index) => {
      const label = labels[index] as HTMLElement | undefined;
      if (!label) return;
      point.set(pad.x, 9, pad.z);
      const distance = point.distanceTo(camera.position);
      point.project(camera);
      const behind = point.z > 1;
      // The pad the ship is on is named by the HUD already.
      const under = overlay.hud?.dataset.pad === pad.id;
      const x = (point.x * 0.5 + 0.5) * size.width;
      const y = (-point.y * 0.5 + 0.5) * size.height;
      label.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      label.style.opacity =
        behind || under
          ? '0'
          : Math.max(0.15, Math.min(1, 1 - (distance - 60) / 110)).toFixed(2);
    });
  });

  return null;
}
