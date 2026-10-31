import type { SectionId } from '@/src/content/sections';
import { hunt } from './hunt';
import { overlay } from './overlay';
import {
  bearingTo,
  navigation,
  shipBearing,
  telemetry,
  toDegrees,
  wrap180,
} from './telemetry';
import { holocrons, pads } from './world/arena';

// Moves the instruments over the flight, every frame, straight in the
// DOM: the compass's tape and marks, the radar's map around the ship, the
// ship and the course on the chart, the readouts and the landing status.
// Nothing is written that has not changed, what moves moves by transforms
// on layers of its own, and text changes ten times a second, which reads
// as live and costs less.

// Pixels per degree of the compass's tape, as in the stylesheet.
export const compassScale = 4;
// World units from the ship to the radar's ring, and that ring's radius in
// the radar's own units, of which the radar is 200 across.
export const radarRange = 64;
export const radarRing = 86;
// World units across the radar's map, as its SVG draws them.
export const radarSpan = 224;

const padAt = new Map(pads.map((pad) => [pad.id as string, pad]));
const holocronAt = new Map(
  holocrons.map((holocron) => [holocron.id as string, holocron]),
);

let textClock = 1;

// The last value written to each element, so the same one is not written
// again.
const written = new WeakMap<Element, string>();
const write = (element: Element, key: string, value: string) => {
  const tag = `${key}:${value}`;
  if (written.get(element) === tag) return false;
  written.set(element, tag);
  return true;
};

const show = (element: Element, visible: boolean) => {
  const value = visible ? '' : 'none';
  const style = (element as HTMLElement | SVGElement).style;
  if (style.display !== value) style.display = value;
};

const move = (element: HTMLElement | SVGElement, transform: string) => {
  if (write(element, 'transform', transform)) {
    element.style.transform = transform;
  }
};

const attribute = (element: Element, name: string, value: string) => {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
};

const signed = (value: number) =>
  `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(1).padStart(5, '0')}`;

const targetOf = (kind: string | undefined, id: string | undefined) => {
  if (kind === 'course') {
    return navigation.course ? padAt.get(navigation.course) : undefined;
  }
  if (!id) return undefined;
  if (kind === 'holocron') {
    return hunt.found.has(id as SectionId) ? undefined : holocronAt.get(id);
  }
  return padAt.get(id);
};

function compass(bearing: number, text: boolean) {
  const tape = overlay.compassTape;
  if (!tape) return;
  const half = overlay.compassHalf;
  if (half <= 0) return;
  move(
    tape,
    `translate3d(${(-(bearing + 90) * compassScale).toFixed(1)}px,0,0)`,
  );
  if (text && overlay.compassReadout) {
    const value = String(Math.round(bearing) % 360).padStart(3, '0');
    if (overlay.compassReadout.textContent !== value) {
      overlay.compassReadout.textContent = value;
    }
  }
  const marks = overlay.compassMarks?.children;
  if (!marks) return;
  for (const mark of marks) {
    const element = mark as HTMLElement;
    const kind = element.dataset.kind;
    const target = targetOf(kind, element.dataset.id);
    if (!target) {
      show(element, false);
      continue;
    }
    let relative = wrap180(bearingTo(target.x, target.z) - bearing);
    const outside = Math.abs(relative) > half;
    // The course stays on the tape, at its edge, pointing the way.
    if (kind === 'course') {
      if (outside) relative = Math.sign(relative) * half;
      const edge = outside ? (relative < 0 ? 'left' : 'right') : '';
      if (element.dataset.edge !== edge) element.dataset.edge = edge;
      if (text) {
        const distance = Math.hypot(
          target.x - telemetry.x,
          target.z - telemetry.z,
        );
        const label = element.firstElementChild;
        const value = `${Math.round(distance)} m`;
        if (label && label.textContent !== value) label.textContent = value;
      }
    } else if (outside) {
      show(element, false);
      continue;
    }
    show(element, true);
    move(element, `translate3d(${(relative * compassScale).toFixed(1)}px,0,0)`);
  }
}

function radar() {
  const map = overlay.radarMap;
  if (!map) return;
  const turn = toDegrees(telemetry.heading);
  // The map turns and slides under the ship, which stays in the middle.
  move(
    map,
    `rotate(${turn.toFixed(2)}deg) translate(${((-telemetry.x / radarSpan) * 100).toFixed(3)}%, ${((-telemetry.z / radarSpan) * 100).toFixed(3)}%)`,
  );
  if (overlay.radarNorth) {
    move(overlay.radarNorth, `rotate(${turn.toFixed(2)}deg)`);
  }
  const edges = overlay.radarEdges?.children;
  const size = overlay.radarSize;
  if (!edges || size <= 0) return;
  const scale = radarRing / radarRange;
  // The chevrons sit just outside the ring, in pixels.
  const reach = ((radarRing + 1) / 200) * size;
  const cos = Math.cos(telemetry.heading);
  const sin = Math.sin(telemetry.heading);
  for (const edge of edges) {
    const element = edge as HTMLElement;
    const target = targetOf(element.dataset.kind, element.dataset.id);
    if (!target) {
      show(element, false);
      continue;
    }
    const dx = target.x - telemetry.x;
    const dz = target.z - telemetry.z;
    // Inside the ring, the map shows it; outside, a chevron on the ring
    // points to it.
    if (Math.hypot(dx, dz) * scale < radarRing - 4) {
      show(element, false);
      continue;
    }
    const rx = dx * cos - dz * sin;
    const rz = dx * sin + dz * cos;
    const length = Math.hypot(rx, rz) || 1;
    const angle = toDegrees(Math.atan2(rx, -rz));
    show(element, true);
    move(
      element,
      `translate(${((rx / length) * reach).toFixed(1)}px, ${((rz / length) * reach).toFixed(1)}px) rotate(${angle.toFixed(1)}deg)`,
    );
  }
}

function chart(text: boolean) {
  if (text && overlay.chartList) {
    for (const field of overlay.chartList.querySelectorAll<HTMLElement>(
      '[data-distance], [data-bearing]',
    )) {
      const pad = padAt.get(
        field.dataset.distance ?? field.dataset.bearing ?? '',
      );
      if (!pad) continue;
      const value =
        field.dataset.distance !== undefined
          ? `${Math.round(Math.hypot(pad.x - telemetry.x, pad.z - telemetry.z))} m`
          : `${String(Math.round(bearingTo(pad.x, pad.z)) % 360).padStart(3, '0')}°`;
      if (field.textContent !== value) field.textContent = value;
    }
  }
  const ship = overlay.chartShip;
  if (ship) {
    attribute(
      ship,
      'transform',
      `translate(${telemetry.x.toFixed(1)} ${telemetry.z.toFixed(1)}) rotate(${(-toDegrees(telemetry.heading)).toFixed(1)})`,
    );
  }
  const line = overlay.chartCourse;
  if (!line) return;
  const target = navigation.course ? padAt.get(navigation.course) : undefined;
  show(line, Boolean(target));
  if (!target) return;
  attribute(line, 'x1', telemetry.x.toFixed(1));
  attribute(line, 'y1', telemetry.z.toFixed(1));
  attribute(line, 'x2', target.x.toFixed(1));
  attribute(line, 'y2', target.z.toFixed(1));
}

function readouts(text: boolean) {
  const root = overlay.hud;
  if (!root) return;
  if (overlay.speedBar) {
    move(
      overlay.speedBar,
      `scaleX(${Math.min(1, telemetry.speed / 40).toFixed(3)})`,
    );
  }
  const boost = telemetry.boost ? '' : undefined;
  if (root.dataset.boost !== boost) {
    if (boost === undefined) delete root.dataset.boost;
    else root.dataset.boost = boost;
  }
  if (!text) return;
  for (const field of root.querySelectorAll<HTMLElement>('[data-read]')) {
    const value =
      field.dataset.read === 'x'
        ? signed(telemetry.x)
        : field.dataset.read === 'z'
          ? signed(telemetry.z)
          : telemetry.speed.toFixed(1);
    if (field.textContent !== value) field.textContent = value;
  }
}

function landing() {
  const status = overlay.landing;
  if (!status) return;
  let phase = 'none';
  if (telemetry.pad) {
    if (telemetry.landed) phase = 'landed';
    else phase = telemetry.speed >= 1.5 ? 'approach' : 'hold';
  }
  if (status.dataset.phase !== phase) status.dataset.phase = phase;
  const value = telemetry.landing.toFixed(2);
  if (write(status, 'landing', value)) {
    status.style.setProperty('--landing', value);
  }
}

export function updateInstruments(dt: number) {
  textClock += dt;
  const text = textClock >= 0.1;
  if (text) textClock = 0;
  compass(shipBearing(), text);
  radar();
  chart(text);
  readouts(text);
  landing();
}
