// THREE
import * as THREE from 'three';
// GAME
import { input } from './controls';
import { telemetry } from './telemetry';
import { groundHeight } from './world/terrain';

// The free camera of the photo mode, as in the photo mode of a console game:
// the flight stops, and the camera goes around the ship and away from it. A
// module object, like the flight's controls: it changes many times a second.
// The pointer, the keys and the sliders move the goal, and the camera eases to
// it. `stepPhoto` runs each frame, from PhotoRig.

// The field of view at 1× zoom, the flight's own.
const baseTan = Math.tan(THREE.MathUtils.degToRad(55 / 2));

export const limits = {
  rotate: [0, 359],
  // Degrees, from a little under the ship to almost straight down.
  angle: [-20, 85],
  distance: [2.5, 70],
  zoom: [0.6, 4],
  tilt: [-45, 45],
} as const;

export type CameraSetting = keyof typeof limits;
export const cameraSettings = Object.keys(limits) as CameraSetting[];

// How far the camera's target can go from the ship, and how high.
const reach = 90;
const ceiling = 60;
// How far over the ground the camera stays.
const clearance = 0.4;

interface Pose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  distance: number;
  zoom: number;
  tilt: number;
}

const newPose = (): Pose => ({
  x: 0,
  y: 0,
  z: 0,
  yaw: 0,
  pitch: 0,
  distance: 12,
  zoom: 1,
  tilt: 0,
});

interface Slider {
  input?: HTMLInputElement | null;
  output?: HTMLOutputElement | null;
}

export const photo = {
  active: false,
  hideShip: false,
  // Q and E: down and up.
  lift: 0,
  // While the photo shows, the keys do not move the camera behind it.
  held: false,
  goal: newPose(),
  now: newPose(),
  home: newPose(),
  anchor: { x: 0, z: 0 },
  root: null as HTMLElement | null,
  sliders: {} as Partial<Record<CameraSetting, Slider>>,
  lastFrame: 0,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const degrees = THREE.MathUtils.radToDeg;
const radians = THREE.MathUtils.degToRad;
const turn = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

// While the camera is free, the world stands still: every frame of the scene
// gets no time, whatever reads it, the ship's physics, the animals, the weather
// and the water alike.
export function stopClock(clock: THREE.Clock) {
  clock.getDelta = () => 0;
}

export function startClock(clock: THREE.Clock) {
  delete (clock as Partial<THREE.Clock>).getDelta;
  clock.oldTime = performance.now();
}

const look = new THREE.Vector3();

// Takes the camera where the flight left it, turning it to the ship.
export function beginPhoto(camera: THREE.PerspectiveCamera, hover: number) {
  const { goal, now, home } = photo;
  const { position } = camera;
  goal.x = telemetry.x;
  goal.y = hover + 0.4;
  goal.z = telemetry.z;
  const dx = position.x - goal.x;
  const dy = position.y - goal.y;
  const dz = position.z - goal.z;
  goal.distance = clamp(
    Math.hypot(dx, dy, dz),
    limits.distance[0],
    limits.distance[1],
  );
  goal.yaw = Math.atan2(dx, dz);
  goal.pitch = Math.asin(clamp(dy / goal.distance, -1, 1));
  goal.zoom = baseTan / Math.tan(radians(camera.fov / 2));
  goal.tilt = 0;
  Object.assign(home, goal);
  // It starts from the very view of the flight.
  camera.getWorldDirection(look);
  now.x = position.x + look.x * goal.distance;
  now.y = position.y + look.y * goal.distance;
  now.z = position.z + look.z * goal.distance;
  now.yaw = goal.yaw + turn(Math.atan2(-look.x, -look.z) - goal.yaw);
  now.pitch = Math.asin(-look.y);
  now.distance = goal.distance;
  now.zoom = goal.zoom;
  now.tilt = 0;
  photo.anchor.x = telemetry.x;
  photo.anchor.z = telemetry.z;
  photo.lift = 0;
  photo.hideShip = false;
  photo.held = false;
  photo.lastFrame = performance.now();
  photo.active = true;
}

export function endPhoto() {
  photo.active = false;
  photo.hideShip = false;
  photo.lift = 0;
}

export function resetCamera() {
  Object.assign(photo.goal, photo.home);
}

export function orbit(dx: number, dy: number) {
  const { goal } = photo;
  goal.yaw -= dx * 0.0055;
  goal.pitch = clamp(
    goal.pitch + dy * 0.0045,
    radians(limits.angle[0]),
    radians(limits.angle[1]),
  );
}

export function dolly(factor: number) {
  const { goal } = photo;
  goal.distance = clamp(
    goal.distance * factor,
    limits.distance[0],
    limits.distance[1],
  );
}

// By pixels on the screen, so what is under the pointer stays under it.
export function pan(dx: number, dy: number, screenHeight: number) {
  const { goal, now } = photo;
  const scale = (2 * now.distance * (baseTan / now.zoom)) / screenHeight;
  goal.x -= Math.cos(now.yaw) * dx * scale;
  goal.z += Math.sin(now.yaw) * dx * scale;
  goal.y += dy * scale;
}

export function setCamera(setting: CameraSetting, value: number) {
  const { goal } = photo;
  if (setting === 'rotate') {
    goal.yaw += turn(radians(value) - goal.yaw);
  } else if (setting === 'angle') {
    goal.pitch = radians(value);
  } else {
    goal[setting] = value;
  }
}

function readSetting(setting: CameraSetting) {
  const { goal } = photo;
  switch (setting) {
    case 'rotate':
      return ((Math.round(degrees(goal.yaw)) % 360) + 360) % 360;
    case 'angle':
      return Math.round(degrees(goal.pitch));
    case 'distance':
      return Number(goal.distance.toFixed(1));
    case 'zoom':
      return Number(goal.zoom.toFixed(2));
    case 'tilt':
      return Math.round(goal.tilt);
  }
}

function showSetting(setting: CameraSetting, value: number) {
  if (setting === 'distance') return `${Math.round(value)} m`;
  if (setting === 'zoom') return `${value.toFixed(1)}×`;
  return `${value}°`;
}

// What the sliders and their numbers show, only when it changes.
function writeSliders() {
  for (const setting of cameraSettings) {
    const slider = photo.sliders[setting];
    if (!slider) continue;
    const value = readSetting(setting);
    const text = String(value);
    if (
      slider.input &&
      slider.input.value !== text &&
      document.activeElement !== slider.input
    ) {
      slider.input.value = text;
    }
    const shown = showSetting(setting, value);
    if (slider.output && slider.output.textContent !== shown) {
      slider.output.textContent = shown;
    }
  }
}

export function stepPhoto(
  camera: THREE.PerspectiveCamera,
  dt: number,
  reduced: boolean,
) {
  const { goal, now, anchor, lift, root } = photo;
  // The keys move what the camera looks at, along the ground: forward is where
  // it faces, whatever its height.
  const { thrust, turn: side, boost } = input.keys;
  if (!photo.held && (thrust || side || lift)) {
    const speed = (5 + now.distance * 0.8) * (boost ? 2.5 : 1) * dt;
    const sin = Math.sin(now.yaw);
    const cos = Math.cos(now.yaw);
    goal.x += (-sin * thrust + cos * side) * speed;
    goal.z += (-cos * thrust - sin * side) * speed;
    goal.y += lift * speed;
  }
  const away = Math.hypot(goal.x - anchor.x, goal.z - anchor.z);
  if (away > reach) {
    goal.x = anchor.x + ((goal.x - anchor.x) / away) * reach;
    goal.z = anchor.z + ((goal.z - anchor.z) / away) * reach;
  }
  goal.y = clamp(goal.y, 0.2, ceiling);

  const k = reduced ? 1 : 1 - Math.exp(-10 * dt);
  now.x += (goal.x - now.x) * k;
  now.y += (goal.y - now.y) * k;
  now.z += (goal.z - now.z) * k;
  now.yaw += (goal.yaw - now.yaw) * k;
  now.pitch += (goal.pitch - now.pitch) * k;
  now.distance += (goal.distance - now.distance) * k;
  now.zoom += (goal.zoom - now.zoom) * k;
  now.tilt += (goal.tilt - now.tilt) * k;

  const flat = Math.cos(now.pitch) * now.distance;
  const x = now.x + Math.sin(now.yaw) * flat;
  const z = now.z + Math.cos(now.yaw) * flat;
  const y = Math.max(
    now.y + Math.sin(now.pitch) * now.distance,
    groundHeight(x, z) + clearance,
  );
  camera.position.set(x, y, z);
  camera.lookAt(now.x, now.y, now.z);
  camera.rotateZ(radians(now.tilt));
  const fov = degrees(2 * Math.atan(baseTan / now.zoom));
  if (Math.abs(camera.fov - fov) > 0.001) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld();

  writeSliders();
  if (root) {
    // For the tests: a frame reads no pixels.
    const place = `${x.toFixed(1)} ${y.toFixed(1)} ${z.toFixed(1)}`;
    if (root.dataset.camera !== place) root.dataset.camera = place;
    const field = fov.toFixed(1);
    if (root.dataset.fov !== field) root.dataset.fov = field;
  }
}
