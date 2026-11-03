'use client';

// THREE
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
// GAME
import { overlay } from './overlay';
import { navigation, telemetry } from './telemetry';
import { pads } from './world/arena';

const padById = new Map(pads.map((pad) => [pad.id as string, pad]));

const point = new THREE.Vector3();
const near = new THREE.Vector3();
let textClock = 1;

// The HUD's pieces a waypoint passes under: the groups in the corners, the
// compass, the touch controls and the notices. Their plates are see-through,
// so a waypoint over one tangled with its readings, as over the mission log
// or the radar on a phone; it hides there instead. They are measured twice
// a second, with the size of each waypoint.
const pieces =
  '.hud__nw > *, .hud__ne > *, .compass, .course-strip, .hud__bottom > *, .touch > *, .toasts > *';
const blocks: DOMRect[] = [];
// What comes up over the lock on the course's destination for a moment.
const notices: DOMRect[] = [];
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

// The part of the picture free of the HUD's pieces, where the lock on the
// course's destination stays: under the compass and the flight plan, over
// what is at the bottom, and clear of the groups in the corners, or under
// them when they leave little between them, as on a phone standing up. Kept
// in from those by the lock's own size, with its name and distance. Measured
// with the rest, twice a second.
const lockSide = 56;
const lockTop = 34;
const lockBottom = 58;
const free = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  // The corners taken at the top of that part: to the right of and over this
  // point on the left, to the left of and over that one on the right.
  nwRight: 0,
  nwBottom: 0,
  neLeft: 0,
  neBottom: 0,
};

const boundsOf = (selector: string) => {
  const bounds = { left: Infinity, right: 0, top: Infinity, bottom: 0 };
  document.querySelectorAll(selector).forEach((piece) => {
    const rect = piece.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    bounds.left = Math.min(bounds.left, rect.left);
    bounds.right = Math.max(bounds.right, rect.right);
    bounds.top = Math.min(bounds.top, rect.top);
    bounds.bottom = Math.max(bounds.bottom, rect.bottom);
  });
  return bounds;
};

// What is at the bottom counts where it is under the part of the picture.
function bottomUnder(left: number, right: number, height: number) {
  let bottom = height;
  document.querySelectorAll('.hud__bottom > *, .touch > *').forEach((piece) => {
    const rect = piece.getBoundingClientRect();
    if (rect.height <= 0 || rect.width <= 0) return;
    if (rect.right < left || rect.left > right) return;
    bottom = Math.min(bottom, rect.top);
  });
  return bottom - lockBottom;
}

function measureFree(width: number, height: number) {
  const nw = boundsOf('.hud__nw > *');
  const ne = boundsOf('.hud__ne > *');
  const neLeft = Math.min(ne.left, width);
  const top = boundsOf('.compass, .course-strip').bottom + lockTop;
  const corners = Math.max(nw.bottom, ne.bottom) + lockTop;
  free.nwRight = 0;
  free.nwBottom = 0;
  free.neLeft = width;
  free.neBottom = 0;
  // All the width, clear of the corners or under them when they leave little
  // between them; failing that, on a low screen, what lies between them.
  free.left = lockSide;
  free.right = width - lockSide;
  free.bottom = bottomUnder(free.left, free.right, height);
  if (neLeft - nw.right >= width * 0.45) {
    free.top = top;
    // The middle must see around the corners, for the lock's way along the
    // edge to have no jumps.
    if (corners < (free.top + free.bottom) / 2) {
      free.nwRight = nw.right + lockSide;
      free.nwBottom = nw.bottom + lockTop;
      free.neLeft = neLeft - lockSide;
      free.neBottom = ne.bottom + lockTop;
      return;
    }
  } else {
    free.top = Math.max(top, corners);
    if (free.bottom - free.top >= 60) return;
    free.top = top;
  }
  free.left = nw.right + lockSide;
  free.right = neLeft - lockSide;
  free.bottom = bottomUnder(free.left, free.right, height);
}

// Keeps the lock on the course's destination over its pad. Off the free
// part of the picture, or behind the camera, it stays on that part's edge,
// on the line from its middle to the pad, with an arrow pointing the way.
// That line turns smoothly around the ship, so the lock never jumps. Over
// its own pad the ship needs no lock.
function placeLock(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
) {
  const lock = overlay.courseLock;
  if (!lock) return;
  const pad = navigation.course ? padById.get(navigation.course) : undefined;
  const hidden =
    !pad ||
    telemetry.pad === pad.id ||
    free.right <= free.left ||
    free.bottom <= free.top;
  const display = hidden ? 'none' : '';
  if (lock.style.display !== display) lock.style.display = display;
  if (hidden) return;
  near.set(pad.x, 6, pad.z).applyMatrix4(camera.matrixWorldInverse);
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  const tanH = tanV * camera.aspect;
  const halfW = width / 2;
  const halfH = height / 2;
  const middleX = (free.left + free.right) / 2;
  const middleY = (free.top + free.bottom) / 2;
  let x = 0;
  let y = 0;
  let dx: number;
  let dy: number;
  const front = near.z < -0.5;
  if (front) {
    x = halfW + (near.x / (-near.z * tanH)) * halfW;
    y = halfH - (near.y / (-near.z * tanV)) * halfH;
    dx = x - middleX;
    dy = y - middleY;
  } else {
    dx = (near.x / tanH) * halfW;
    dy = ((-near.y + near.z) / tanV) * halfH;
  }
  const inside =
    front &&
    x >= free.left &&
    x <= free.right &&
    y >= free.top &&
    y <= free.bottom &&
    !(x < free.nwRight && y < free.nwBottom) &&
    !(x > free.neLeft && y < free.neBottom);
  if (!inside) {
    let reach = Math.min(
      (free.right - free.left) / 2 / Math.max(Math.abs(dx), 0.001),
      (free.bottom - free.top) / 2 / Math.max(Math.abs(dy), 0.001),
    );
    if (dy < 0) {
      // Short of a corner the line runs into.
      const corner = dx < 0 ? free.nwRight : free.neLeft;
      const under = dx < 0 ? free.nwBottom : free.neBottom;
      if (under > 0) {
        const enters = Math.max(
          (corner - middleX) / (dx || 0.001),
          (under - middleY) / dy,
        );
        if (enters > 0 && enters < reach) reach = enters;
      }
    }
    x = middleX + dx * reach;
    y = middleY + dy * reach;
    if (overlay.courseArrow) {
      overlay.courseArrow.style.transform = `rotate(${((Math.atan2(dy, dx) * 180) / Math.PI + 90).toFixed(1)}deg)`;
    }
  }
  lock.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  const edge = inside ? 'false' : 'true';
  if (lock.dataset.edge !== edge) lock.dataset.edge = edge;
  // Under a notice it would show only in part, around it: it steps back.
  const underNotice = notices.some(
    (block) =>
      x + lockSide > block.left &&
      x - lockSide < block.right &&
      y + lockBottom > block.top &&
      y - lockTop < block.bottom,
  );
  const opacity = underNotice ? '0' : '';
  if (lock.style.opacity !== opacity) lock.style.opacity = opacity;
}

// Keeps the waypoints of the pads, which are HTML over the canvas, above
// their pads on screen, fading with the distance, with how far each lies
// from the ship and a mark on the one the course leads to. The pad the
// ship is on loses its waypoint: the HUD names it. So does the one the
// course leads to, whose lock names it.
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
      notices.length = 0;
      document.querySelectorAll('.toasts > *, .hud__pad').forEach((piece) => {
        const rect = piece.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) notices.push(rect);
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
      measureFree(size.width, size.height);
    }
    placeLock(camera as THREE.PerspectiveCamera, size.width, size.height);
    pads.forEach((pad, index) => {
      const label = labels[index] as HTMLElement | undefined;
      if (!label) return;
      point.set(pad.x, 9, pad.z);
      const distance = point.distanceTo(camera.position);
      point.project(camera);
      const behind = point.z > 1;
      const target = navigation.course === pad.id;
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
          under || target || covered(x, y, index)
            ? '0'
            : Math.max(0.2, Math.min(1, 1 - (distance - 60) / 110)).toFixed(2);
      }
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
