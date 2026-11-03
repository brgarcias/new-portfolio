import type { SectionId } from '@/src/content/sections';
import { navigation } from './telemetry';
import { arena, padRadius, pads, platformRadius } from './world/arena';

// The flight plan: when a course is set, the ship's nav computer works out a
// way there that goes around what is solid and around the other pads, which
// would catch the ship, instead of a straight line through them. Pure
// arithmetic, like physics.ts, so the tests can run it too; world/Course.tsx
// projects the result over the world and the instruments read it.

export interface Point {
  x: number;
  z: number;
}

export interface Gate extends Point {
  // How far along the route it stands, the way the route runs there, and
  // how wide it opens, of its full width.
  along: number;
  heading: number;
  width: number;
  // Seconds since the ship flew through it, or below zero if it has not.
  age: number;
}

// The route is a walk of points this far apart.
export const routeStep = 1.5;
// One gate every this many units, or more on a long route, the first this
// far from the start, and a route has no more than this many.
const gateSpacing = 17;
const gateStart = 15;
export const maxGates = 14;
const gateRoom = 4.5;

// A grid over the platform, on which the search runs.
const cell = 2.5;
const half = platformRadius + cell;
const side = Math.ceil((half * 2) / cell) + 1;
const toCell = (value: number) =>
  Math.min(side - 1, Math.max(0, Math.round((value + half) / cell)));
const toWorld = (index: number) => index * cell - half;

// The room the route keeps. Nothing closer to what is solid than the ship's
// widest radius and a little; a straight stretch and the open space prefer
// more, but a narrow way through is better than going around the whole
// forest, so being close only costs more.
const hardRoom = 3.4;
const sightRoom = 5;
const openRoom = 9;
const crowding = 2.5;
// The other pads would catch a ship that stops, and the edge is no place to
// fly along. The corners round off by this much at most.
const padRoom = 2.5;
const edgeRoom = 6;
const cornerCut = 5;

const padIndex = new Map(pads.map((pad, index) => [pad.id, index]));

// How much room each cell of the grid has, and which pad's ground it is on.
// The same for every route, so worked out once, the first time.
let grid: { room: Float32Array; padAt: Int8Array } | null = null;

function gridOf() {
  if (grid) return grid;
  const room = new Float32Array(side * side);
  const padAt = new Int8Array(side * side).fill(-1);
  for (let row = 0; row < side; row++) {
    for (let column = 0; column < side; column++) {
      const x = toWorld(column);
      const z = toWorld(row);
      let least = platformRadius - edgeRoom - Math.hypot(x, z) + hardRoom;
      for (const o of arena.obstacles) {
        least = Math.min(least, Math.hypot(x - o.x, z - o.z) - o.r);
      }
      room[row * side + column] = least;
      pads.forEach((pad, index) => {
        if (Math.hypot(x - pad.x, z - pad.z) < pad.r + padRoom + cell / 2) {
          padAt[row * side + column] = index;
        }
      });
    }
  }
  grid = { room, padAt };
  return grid;
}

// The room at any point, from what is solid.
const roomAt = (x: number, z: number) => {
  let least = Infinity;
  for (const o of arena.obstacles) {
    least = Math.min(least, Math.hypot(x - o.x, z - o.z) - o.r);
  }
  return least;
};

type Closed = (index: number) => boolean;

// The nearest open cell to a point, going around it ring by ring.
function openCellNear(closed: Closed, x: number, z: number) {
  const column = toCell(x);
  const row = toCell(z);
  for (let reach = 0; reach < side; reach++) {
    let best = -1;
    let bestDistance = Infinity;
    for (let r = row - reach; r <= row + reach; r++) {
      for (let c = column - reach; c <= column + reach; c++) {
        if (Math.max(Math.abs(r - row), Math.abs(c - column)) !== reach) {
          continue;
        }
        if (r < 0 || c < 0 || r >= side || c >= side) continue;
        if (closed(r * side + c)) continue;
        const distance = Math.hypot(toWorld(c) - x, toWorld(r) - z);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = r * side + c;
        }
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}

const neighbours = [
  [-1, 0, 1],
  [1, 0, 1],
  [0, -1, 1],
  [0, 1, 1],
  [-1, -1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [1, 1, Math.SQRT2],
] as const;

// A* over the grid, with a small heap: the cheapest way, which takes longer
// to get close to things. The cells of the way, from the first to the last,
// or nothing when the way is closed.
function search(
  closed: Closed,
  room: Float32Array,
  start: number,
  goal: number,
) {
  const cost = new Float32Array(side * side).fill(Infinity);
  const from = new Int32Array(side * side).fill(-1);
  const goalRow = Math.floor(goal / side);
  const goalColumn = goal % side;
  const guess = (index: number) => {
    const dr = Math.abs(Math.floor(index / side) - goalRow);
    const dc = Math.abs((index % side) - goalColumn);
    return Math.max(dr, dc) + (Math.SQRT2 - 1) * Math.min(dr, dc);
  };
  const heap: [number, number][] = [[guess(start), start]];
  const push = (entry: [number, number]) => {
    heap.push(entry);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let least = i;
        if (left < heap.length && heap[left][0] < heap[least][0]) least = left;
        if (right < heap.length && heap[right][0] < heap[least][0]) {
          least = right;
        }
        if (least === i) break;
        [heap[least], heap[i]] = [heap[i], heap[least]];
        i = least;
      }
    }
    return top;
  };
  cost[start] = 0;
  while (heap.length) {
    const [, current] = pop();
    if (current === goal) {
      const way: number[] = [];
      for (let at = goal; at !== -1; at = from[at]) way.push(at);
      return way.reverse();
    }
    const row = Math.floor(current / side);
    const column = current % side;
    for (const [dc, dr, length] of neighbours) {
      const r = row + dr;
      const c = column + dc;
      if (r < 0 || c < 0 || r >= side || c >= side) continue;
      const next = r * side + c;
      if (closed(next)) continue;
      // Never between two closed cells, across a corner.
      if (dc && dr && (closed(row * side + c) || closed(r * side + column))) {
        continue;
      }
      const crowded = Math.max(0, 1 - room[next] / openRoom);
      const reached = cost[current] + length * (1 + crowding * crowded);
      if (reached >= cost[next]) continue;
      cost[next] = reached;
      from[next] = current;
      push([reached + guess(next), next]);
    }
  }
  return null;
}

const distanceToSegment = (p: Point, a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared
    ? Math.max(
        0,
        Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / lengthSquared),
      )
    : 0;
  return Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t));
};

// Whether a straight stretch keeps its room: from what it passes, the room
// it should; from what one of its ends is already near, as the ship beside a
// rock or a narrow way through, no less than that end has.
function inSight(a: Point, b: Point, open: Set<SectionId>) {
  const keeps = (center: Point, radius: number, room: number) => {
    const closest = distanceToSegment(center, a, b) - radius;
    if (closest >= room) return true;
    const ends =
      Math.min(
        Math.hypot(a.x - center.x, a.z - center.z),
        Math.hypot(b.x - center.x, b.z - center.z),
      ) - radius;
    return closest >= ends - 0.01;
  };
  return (
    arena.obstacles.every((o) => keeps(o, o.r, sightRoom)) &&
    pads.every((pad) => open.has(pad.id) || keeps(pad, pad.r, padRoom))
  );
}

// Keeps only the corners of a way: from each point, as far along as can be
// seen.
function pull(way: Point[], open: Set<SectionId>) {
  const corners = [way[0]];
  for (let i = 0; i < way.length - 1;) {
    let j = way.length - 1;
    while (j > i + 1 && !inSight(way[i], way[j], open)) j--;
    corners.push(way[j]);
    i = j;
  }
  return corners;
}

const bend = (a: Point, corner: Point, b: Point, t: number) => {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * corner.x + t * t * b.x,
    z: u * u * a.z + 2 * u * t * corner.z + t * t * b.z,
  };
};

// Rounds the corners into short curves, tighter where a wider one would
// come too close to something, and walks the result in even steps.
function walk(corners: Point[]) {
  const line: Point[] = [corners[0]];
  for (let i = 1; i < corners.length - 1; i++) {
    const before = corners[i - 1];
    const corner = corners[i];
    const after = corners[i + 1];
    const toBefore = Math.hypot(before.x - corner.x, before.z - corner.z);
    const toAfter = Math.hypot(after.x - corner.x, after.z - corner.z);
    const limit = Math.min(hardRoom, roomAt(corner.x, corner.z));
    let cut = Math.min(cornerCut, toBefore * 0.45, toAfter * 0.45);
    const ends = () => ({
      a: {
        x: corner.x + ((before.x - corner.x) / toBefore) * cut,
        z: corner.z + ((before.z - corner.z) / toBefore) * cut,
      },
      b: {
        x: corner.x + ((after.x - corner.x) / toAfter) * cut,
        z: corner.z + ((after.z - corner.z) / toAfter) * cut,
      },
    });
    let { a, b } = ends();
    for (let tries = 0; tries < 3; tries++) {
      const middle = bend(a, corner, b, 0.5);
      if (roomAt(middle.x, middle.z) >= limit) break;
      cut /= 2;
      ({ a, b } = ends());
    }
    for (let k = 0; k <= 8; k++) line.push(bend(a, corner, b, k / 8));
  }
  line.push(corners[corners.length - 1]);

  const points: Point[] = [line[0]];
  let left = routeStep;
  for (let i = 1; i < line.length; i++) {
    let from = line[i - 1];
    const to = line[i];
    let length = Math.hypot(to.x - from.x, to.z - from.z);
    while (length >= left && length > 0) {
      const t = left / length;
      const next = {
        x: from.x + (to.x - from.x) * t,
        z: from.z + (to.z - from.z) * t,
      };
      points.push(next);
      from = next;
      length = Math.hypot(to.x - from.x, to.z - from.z);
      left = routeStep;
    }
    left -= length;
  }
  points.push(line[line.length - 1]);
  return points;
}

// The way from a point to a pad, as points routeStep apart, the last on the
// pad's center. The pad the ship may be on is open, to fly straight off it.
export function plotRoute(x: number, z: number, id: SectionId): Point[] {
  const goalPad = padIndex.get(id);
  if (goalPad === undefined) return [];
  const pad = pads[goalPad];
  const start = { x, z };
  const { room, padAt } = gridOf();
  const startPad = padAt[toCell(z) * side + toCell(x)];
  const closed: Closed = (index) =>
    room[index] < hardRoom ||
    (padAt[index] >= 0 &&
      padAt[index] !== goalPad &&
      padAt[index] !== startPad);
  const from = openCellNear(closed, x, z);
  const to = openCellNear(closed, pad.x, pad.z);
  const cells = from >= 0 && to >= 0 ? search(closed, room, from, to) : null;
  if (!cells) return walk([start, { x: pad.x, z: pad.z }]);
  const open = new Set<SectionId>([id]);
  if (startPad >= 0) open.add(pads[startPad].id);
  return walk(
    pull(
      [
        start,
        ...cells.map((index) => ({
          x: toWorld(index % side),
          z: toWorld(Math.floor(index / side)),
        })),
        { x: pad.x, z: pad.z },
      ],
      open,
    ),
  );
}

// The gates along a route, up to the pad's edge, narrower where the route
// passes close to something.
export function gatesOf(points: Point[]): Gate[] {
  const gates: Gate[] = [];
  const end = (points.length - 1) * routeStep - padRadius - 6;
  const spacing = Math.max(gateSpacing, (end - gateStart) / (maxGates - 1));
  for (let along = gateStart; along <= end; along += spacing) {
    const index = Math.round(along / routeStep);
    const point = points[index];
    const before = points[Math.max(0, index - 2)];
    const after = points[Math.min(points.length - 1, index + 2)];
    gates.push({
      x: point.x,
      z: point.z,
      along: index * routeStep,
      heading: Math.atan2(-(after.x - before.x), -(after.z - before.z)),
      width: Math.max(0.6, Math.min(1, roomAt(point.x, point.z) / gateRoom)),
      age: -1,
    });
  }
  return gates;
}

// The flight plan in progress, which the frame loop reads and writes.
export const route = {
  id: null as SectionId | null,
  points: [] as Point[],
  gates: [] as Gate[],
  // Changes with each plot, for what is drawn from the points.
  version: 0,
  // Which point the ship is at, how far along that is, and the whole length.
  index: 0,
  progress: 0,
  length: 0,
  // The longest the way has been, for the progress bar.
  planned: 0,
  // The ship's cruising speed, for the time left.
  cruise: 26,
  // How far the projection has drawn the route, and how far the column of
  // light on the pad has risen, from 0 to 1.
  drawn: 0,
  risen: 0,
  // How much of it all shows: it fades when the course is cleared.
  presence: 0,
  // Seconds left of the notice that the route is being worked out again, and
  // how many times it was.
  recalculating: 0,
  recalculations: 0,
  // Gates flown through since the course was set.
  flown: 0,
  // Seconds off the route, and since it was last plotted.
  astray: 0,
  age: 0,
};

// Off the route by this much, for a moment, the computer works it out again.
const astrayDistance = 12;
const astrayTime = 0.4;
const replotAfter = 1.5;
// How far ahead along the route the ship can be found from one frame to the
// next.
const reach = 24;
// How fast the route draws itself, in units per second, and how long the
// notice of a new route stays.
const drawSpeed = 110;
const redrawSpeed = 320;
const noticeTime = 1.4;

function plot(x: number, z: number, id: SectionId) {
  route.points = plotRoute(x, z, id);
  route.gates = gatesOf(route.points);
  route.length = (route.points.length - 1) * routeStep;
  route.index = 0;
  route.progress = 0;
  route.astray = 0;
  route.age = 0;
  route.version += 1;
}

// A new flight starts with no plan drawn, even if the course stayed set: the
// ship is somewhere else now.
export function resetRoute() {
  route.id = null;
  route.presence = 0;
}

export interface RouteEvents {
  // The ship flew through a gate; this is how many it has flown through.
  onGate?: (flown: number) => void;
  // The route started to draw itself over the world.
  onPlot?: () => void;
  // The route was worked out again from where the ship is.
  onRecalculate?: () => void;
}

// One frame of the plan: follows the course set on the chart, the ship along
// the route, and the projection as it draws itself, which waits while a
// dialog covers the flight.
export function followRoute(
  x: number,
  z: number,
  dt: number,
  options: { reduced: boolean; held: boolean },
  events: RouteEvents = {},
) {
  const course = navigation.course;
  if (course !== route.id) {
    route.id = course;
    if (course) {
      plot(x, z, course);
      route.planned = route.length;
      route.flown = 0;
      route.recalculating = 0;
      route.drawn = 0;
      route.risen = 0;
    }
  }
  route.presence = course
    ? Math.min(1, route.presence + dt * 4)
    : Math.max(0, route.presence - dt * 4);
  if (!course) return;

  route.age += dt;
  route.recalculating = Math.max(0, route.recalculating - dt);

  // The nearest point a little ahead of where the ship was: never back along
  // the route, so a route that passes near itself does not jump.
  const last = route.points.length - 1;
  let nearest = route.index;
  let distance = Infinity;
  for (let i = route.index; i <= Math.min(last, route.index + reach); i++) {
    const point = route.points[i];
    const away = Math.hypot(point.x - x, point.z - z);
    if (away < distance) {
      distance = away;
      nearest = i;
    }
  }
  route.index = nearest;
  route.progress = nearest * routeStep;

  // Astray for a moment, and not just after a plot, the plan starts over from
  // where the ship is.
  route.astray = distance > astrayDistance ? route.astray + dt : 0;
  if (route.astray > astrayTime && route.age > replotAfter) {
    plot(x, z, course);
    route.planned = Math.max(route.planned, route.length);
    route.recalculating = noticeTime;
    route.recalculations += 1;
    route.drawn = 0;
    route.risen = 1;
    events.onRecalculate?.();
  }

  if (!options.held) {
    if (route.drawn === 0 && route.recalculating === 0) events.onPlot?.();
    const speed = route.recalculating > 0 ? redrawSpeed : drawSpeed;
    route.drawn = options.reduced
      ? route.length
      : Math.min(route.length, route.drawn + speed * dt);
    if (route.drawn >= route.length) {
      route.risen = options.reduced ? 1 : Math.min(1, route.risen + dt * 1.2);
    }
  }

  // The gates the ship has passed.
  for (const gate of route.gates) {
    if (gate.age >= 0) {
      gate.age += dt;
    } else if (route.progress >= gate.along) {
      gate.age = 0;
      route.flown += 1;
      events.onGate?.(route.flown);
    }
  }
}
