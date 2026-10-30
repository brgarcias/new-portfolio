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
// Text changes ten times a second, which reads as live and costs less.

// Pixels per degree of the compass's tape, as in the stylesheet.
export const compassScale = 4;
// World units from the ship to the radar's ring, and that ring's radius in
// the radar's own units.
export const radarRange = 64;
export const radarRing = 86;

const padAt = new Map(pads.map((pad) => [pad.id as string, pad]));
const holocronAt = new Map(
  holocrons.map((holocron) => [holocron.id as string, holocron]),
);

let textClock = 1;

const show = (element: Element, visible: boolean) => {
  const value = visible ? '' : 'none';
  const style = (element as HTMLElement | SVGElement).style;
  if (style.display !== value) style.display = value;
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
  tape.style.transform = `translate3d(${(-(bearing + 90) * compassScale).toFixed(1)}px,0,0)`;
  if (text && overlay.compassReadout) {
    overlay.compassReadout.textContent = String(
      Math.round(bearing) % 360,
    ).padStart(3, '0');
  }
  const marks = overlay.compassMarks?.children;
  if (!marks) return;
  const half = overlay.compassHalf;
  for (const mark of marks) {
    const element = mark as HTMLElement;
    const kind = element.dataset.kind;
    const target = targetOf(kind, element.dataset.id);
    if (!target || half <= 0) {
      show(element, false);
      continue;
    }
    let relative = wrap180(bearingTo(target.x, target.z) - bearing);
    const outside = Math.abs(relative) > half;
    // The course stays on the tape, at its edge, pointing the way.
    if (kind === 'course') {
      if (outside) relative = Math.sign(relative) * half;
      element.dataset.edge = outside ? (relative < 0 ? 'left' : 'right') : '';
      if (text) {
        const distance = Math.hypot(
          target.x - telemetry.x,
          target.z - telemetry.z,
        );
        const label = element.querySelector('small');
        if (label) label.textContent = `${Math.round(distance)} m`;
      }
    } else if (outside) {
      show(element, false);
      continue;
    }
    show(element, true);
    element.style.transform = `translate3d(${(relative * compassScale).toFixed(1)}px,0,0)`;
  }
}

function radar() {
  const world = overlay.radarWorld;
  if (!world) return;
  const scale = radarRing / radarRange;
  const turn = toDegrees(telemetry.heading);
  world.setAttribute(
    'transform',
    `scale(${scale.toFixed(4)}) rotate(${turn.toFixed(2)}) translate(${(-telemetry.x).toFixed(2)} ${(-telemetry.z).toFixed(2)})`,
  );
  overlay.radarNorth?.setAttribute('transform', `rotate(${turn.toFixed(2)})`);
  const edges = overlay.radarEdges?.children;
  if (!edges) return;
  const cos = Math.cos(telemetry.heading);
  const sin = Math.sin(telemetry.heading);
  for (const edge of edges) {
    const element = edge as SVGElement;
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
    element.setAttribute(
      'transform',
      `translate(${((rx / length) * (radarRing + 1)).toFixed(2)} ${((rz / length) * (radarRing + 1)).toFixed(2)}) rotate(${angle.toFixed(1)})`,
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
    ship.setAttribute(
      'transform',
      `translate(${telemetry.x.toFixed(2)} ${telemetry.z.toFixed(2)}) rotate(${(-toDegrees(telemetry.heading)).toFixed(1)})`,
    );
  }
  const line = overlay.chartCourse;
  if (!line) return;
  const target = navigation.course ? padAt.get(navigation.course) : undefined;
  show(line, Boolean(target));
  if (!target) return;
  line.setAttribute('x1', telemetry.x.toFixed(2));
  line.setAttribute('y1', telemetry.z.toFixed(2));
  line.setAttribute('x2', target.x.toFixed(2));
  line.setAttribute('y2', target.z.toFixed(2));
}

function readouts(text: boolean) {
  const root = overlay.hud;
  if (!root) return;
  root.style.setProperty(
    '--speed',
    Math.min(1, telemetry.speed / 40).toFixed(3),
  );
  if (telemetry.boost) root.dataset.boost = '';
  else delete root.dataset.boost;
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
  status.style.setProperty('--landing', telemetry.landing.toFixed(3));
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
