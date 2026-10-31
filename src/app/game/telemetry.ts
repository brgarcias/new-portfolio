import type { SectionId } from '@/src/content/sections';
import type { Sector } from './world/biomes';

// The flight as the instruments read it, written by the ship every frame:
// where it is and where it faces, how fast it goes and whether it boosts,
// the sector and the pad under it, and how far along a landing is.
export const telemetry = {
  x: 0,
  z: 0,
  heading: 0,
  speed: 0,
  boost: false,
  sector: 'hub' as Sector,
  pad: null as SectionId | null,
  // From 0 to 1 while the ship holds still on a pad, before it lands.
  landing: 0,
  // Whether the ship has landed on the pad it is on.
  landed: false,
};

// The destination picked on the navigation chart, which the instruments
// point to. The game keeps it in its state too, for what React draws.
export const navigation = {
  course: null as SectionId | null,
};

export function resetTelemetry() {
  Object.assign(telemetry, {
    x: 0,
    z: 0,
    heading: 0,
    speed: 0,
    boost: false,
    sector: 'hub',
    pad: null,
    landing: 0,
    landed: false,
  });
}

// The bearing from the ship to a point, in degrees clockwise from the way
// the ships start facing, and the ship's own.
export const toDegrees = (radians: number) => (radians * 180) / Math.PI;
export const wrap360 = (degrees: number) => ((degrees % 360) + 360) % 360;
export const wrap180 = (degrees: number) => wrap360(degrees + 180) - 180;
export const bearingTo = (x: number, z: number) =>
  wrap360(toDegrees(Math.atan2(x - telemetry.x, -(z - telemetry.z))));
export const shipBearing = () => wrap360(-toDegrees(telemetry.heading));
