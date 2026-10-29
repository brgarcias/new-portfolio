import type { SectionId } from '@/src/content/sections';
import { pads, platformRadius } from './arena';
import { hubRadius, sectorOfAngle } from './biomes';

// The relief of the ground, which the ground's mesh, the plants and the
// animals all read, so everything stands where the ground is.

export const noise = (x: number, z: number) =>
  0.6 * (0.5 + 0.5 * Math.sin(x * 0.23 + 1.3) * Math.sin(z * 0.19 + 0.4)) +
  0.4 * (0.5 + 0.5 * Math.sin(x * 0.61 + 0.7) * Math.cos(z * 0.47 + 2.1));

// The relief of each sector, never higher than the props' footings.
function relief(sector: SectionId, x: number, z: number) {
  switch (sector) {
    case 'about':
      return 0.6 * (0.5 + 0.5 * Math.sin(x * 0.19 + 1.3) * Math.sin(z * 0.16));
    case 'education':
      return -0.15 + 0.25 * noise(x, z);
    case 'courses':
      return -0.5;
    case 'projects':
      return 0.3 * noise(x, z);
    case 'contributing':
      return 0.35 * noise(x, z);
    case 'contact':
      return 0.55 * (0.5 + 0.5 * Math.sin(x * 0.22) * Math.cos(z * 0.2));
    default:
      return 0;
  }
}

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// The sector whose ground a point lies on: the border between two sectors
// wanders a little, so it does not cut straight across.
export function sectorUnder(x: number, z: number): SectionId {
  const r = Math.hypot(x, z);
  const angle = Math.atan2(x, -z);
  return sectorOfAngle(angle + 0.035 * Math.sin(r * 0.31 + angle * 4));
}

// The height of the ground at a point: the sector's relief, flat under
// the pads, on the hub and at the edge.
export function groundHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  if (r < hubRadius) return 0;
  let height = relief(sectorUnder(x, z), x, z);
  for (const pad of pads) {
    height *= smoothstep(
      pad.r + 1,
      pad.r + 5,
      Math.hypot(x - pad.x, z - pad.z),
    );
  }
  height *= smoothstep(hubRadius, hubRadius + 6, r);
  height *= 1 - smoothstep(platformRadius - 5, platformRadius, r);
  return height;
}
