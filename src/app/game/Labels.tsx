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

// The HUD's pieces a waypoint passes under: the groups in the corners, the
// compass, the touch controls and the notices. Their plates are see-through,
// so a waypoint over one tangled with its readings, as over the mission log
// or the radar on a phone; it hides there instead. They are measured twice
// a second, with the size of each waypoint.
const pieces =
  '.hud__nw > *, .hud__ne > *, .compass, .hud__bottom > *, .touch > *, .toasts > *';
const blocks: DOMRect[] = [];
const sizes: { width: number; height: number }[] = [];
let measureClock = 1;

// Whether a waypoint, its box and the stem down to its pad, meets a piece.
const covered = (x: number, y: number, index: number) => {
  const size = sizes[index];
  if (!size) return false;
  const left = x - size.width / 2;
  const right = x + size.width / 2;
  const top = y - 14 - size.height;
  return blocks.some(
    (block) =>
      left < block.right + 4 &&
      right > block.left - 4 &&
      top < block.bottom + 4 &&
      y > block.top - 4,
  );
};

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
    measureClock += delta;
    if (measureClock >= 0.5) {
      measureClock = 0;
      blocks.length = 0;
      document.querySelectorAll(pieces).forEach((piece) => {
        const rect = piece.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) blocks.push(rect);
      });
      for (let index = 0; index < labels.length; index++) {
        const label = labels[index] as HTMLElement;
        if (label.offsetWidth > 0) {
          sizes[index] = {
            width: label.offsetWidth,
            height: label.offsetHeight,
          };
        }
      }
    }
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
      // A waypoint whose pad is behind or off the screen leaves the page,
      // instead of waiting far past its edge: a phone's browser could take
      // it for more page to show.
      const offScreen =
        behind ||
        x < -120 ||
        x > size.width + 120 ||
        y < -40 ||
        y > size.height + 160;
      const display = offScreen ? 'none' : '';
      if (label.style.display !== display) label.style.display = display;
      if (!offScreen) {
        label.style.transform = `translate(-50%, calc(-100% - 14px)) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        label.style.opacity =
          under || covered(x, y, index)
            ? '0'
            : Math.max(0.2, Math.min(1, 1 - (distance - 60) / 110)).toFixed(2);
      }
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
