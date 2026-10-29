// The flight of a ship that hovers over the arena: it moves on the plane of
// the platform, at a fixed height, and keeps its momentum, so it drifts a
// little through the turns and bounces off what it hits. Pure arithmetic,
// apart from three.js, so the tests can run it too.

export interface Handling {
  // Units per second, and per second squared.
  maxSpeed: number;
  acceleration: number;
  // Radians per second, at full speed.
  turnRate: number;
  // How much the boost multiplies the speed and the acceleration.
  boost: number;
  // Of the circle that collides, around the ship's center.
  radius: number;
}

export interface Obstacle {
  x: number;
  z: number;
  r: number;
}

export interface Pad {
  id: string;
  x: number;
  z: number;
  r: number;
}

export interface Arena {
  // Of the platform. Past its edge there is only space.
  radius: number;
  obstacles: Obstacle[];
  pads: Pad[];
}

// What the pilot asks: thrust from -1 (reverse) to 1, turn from -1 (left)
// to 1 (right), and the boost.
export interface Controls {
  thrust: number;
  turn: number;
  boost: boolean;
}

export interface ShipState {
  x: number;
  z: number;
  // The heading, in radians, as the rotation of a three.js object around
  // its Y axis: 0 faces -Z, and a positive turn (to the right) lowers it.
  heading: number;
  vx: number;
  vz: number;
  speed: number;
  // How fast the ship ran into something in the last step, or 0.
  hit: number;
  // The pad the ship is over, if any.
  pad: string | null;
}

// How much speed a bounce keeps.
const restitution = 0.45;

export function createState(x = 0, z = 0, heading = 0): ShipState {
  return { x, z, heading, vx: 0, vz: 0, speed: 0, hit: 0, pad: null };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Bounces the ship off a surface whose normal (nx, nz) points away from it.
function bounce(state: ShipState, nx: number, nz: number) {
  const along = state.vx * nx + state.vz * nz;
  if (along >= 0) return;
  state.vx -= (1 + restitution) * along * nx;
  state.vz -= (1 + restitution) * along * nz;
  state.hit = Math.max(state.hit, -along);
}

// Advances the ship by dt seconds.
export function step(
  state: ShipState,
  controls: Controls,
  handling: Handling,
  arena: Arena,
  dt: number,
) {
  const thrust = clamp(controls.thrust, -1, 1);
  const turn = clamp(controls.turn, -1, 1);
  const boost = controls.boost && thrust > 0 ? handling.boost : 1;

  // A hovering ship turns on the spot, but slowly: the turn gets quicker
  // with speed.
  const agility = 0.4 + 0.6 * Math.min(1, state.speed / 8);
  state.heading -= turn * handling.turnRate * agility * dt;

  const fx = -Math.sin(state.heading);
  const fz = -Math.cos(state.heading);
  const rx = Math.cos(state.heading);
  const rz = -Math.sin(state.heading);
  let along = state.vx * fx + state.vz * fz;
  let lateral = state.vx * rx + state.vz * rz;

  // Reverse thrust brakes harder than the engines push.
  const push = thrust * handling.acceleration * (thrust > 0 ? boost : 1.4);
  along += push * dt;
  // Coasting loses little speed; drifting sideways loses it fast. A pad
  // catches the ship, which stops within a few units unless the thrust
  // stays on.
  along *= Math.exp(-(state.pad && thrust <= 0 ? 12 : 0.45) * dt);
  lateral *= Math.exp(-5 * dt);
  const max = handling.maxSpeed * boost;
  along = clamp(along, -max * 0.35, max);

  state.vx = fx * along + rx * lateral;
  state.vz = fz * along + rz * lateral;
  state.x += state.vx * dt;
  state.z += state.vz * dt;
  state.hit = 0;

  for (const obstacle of arena.obstacles) {
    const dx = state.x - obstacle.x;
    const dz = state.z - obstacle.z;
    const distance = Math.hypot(dx, dz);
    const minimum = obstacle.r + handling.radius;
    if (distance >= minimum) continue;
    const nx = distance > 0 ? dx / distance : 1;
    const nz = distance > 0 ? dz / distance : 0;
    state.x = obstacle.x + nx * minimum;
    state.z = obstacle.z + nz * minimum;
    bounce(state, nx, nz);
  }

  // The edge of the platform holds the ship in.
  const fromCenter = Math.hypot(state.x, state.z);
  const limit = arena.radius - handling.radius;
  if (fromCenter > limit) {
    const nx = -state.x / fromCenter;
    const nz = -state.z / fromCenter;
    state.x = -nx * limit;
    state.z = -nz * limit;
    bounce(state, nx, nz);
  }

  state.speed = Math.hypot(state.vx, state.vz);
  state.pad =
    arena.pads.find(
      (pad) => Math.hypot(state.x - pad.x, state.z - pad.z) < pad.r,
    )?.id ?? null;
}
