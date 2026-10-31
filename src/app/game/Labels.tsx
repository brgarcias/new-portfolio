'use client';

// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// GAME
import { overlay } from './overlay';
import { navigation, telemetry } from './telemetry';
import { pads } from './world/arena';

const point = new THREE.Vector3();
let textClock = 1;

// Keeps the waypoints of the pads, which are HTML over the canvas, above
// their pads on screen, fading with the distance, with how far each lies
// from the ship and a mark on the one the course leads to. The pad the
// ship is on loses its waypoint: the HUD names it.
export default function Labels() {
  useFrame(({ camera, size }, delta) => {
    const labels = overlay.labels?.children;
    if (!labels) return;
    textClock += delta;
    const text = textClock >= 0.15;
    if (text) textClock = 0;
    pads.forEach((pad, index) => {
      const label = labels[index] as HTMLElement | undefined;
      if (!label) return;
      point.set(pad.x, 9, pad.z);
      const distance = point.distanceTo(camera.position);
      point.project(camera);
      const behind = point.z > 1;
      const under = telemetry.pad === pad.id;
      const x = (point.x * 0.5 + 0.5) * size.width;
      const y = (-point.y * 0.5 + 0.5) * size.height;
      label.style.transform = `translate(-50%, calc(-100% - 14px)) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      label.style.opacity =
        behind || under
          ? '0'
          : Math.max(0.2, Math.min(1, 1 - (distance - 60) / 110)).toFixed(2);
      const target = navigation.course === pad.id;
      if (target !== label.hasAttribute('data-course')) {
        if (target) label.setAttribute('data-course', '');
        else label.removeAttribute('data-course');
      }
      if (text) {
        const away = Math.hypot(pad.x - telemetry.x, pad.z - telemetry.z);
        const field = label.lastElementChild;
        const value = `${Math.round(away)} m`;
        if (field && field.textContent !== value) field.textContent = value;
      }
    });
  });

  return null;
}
