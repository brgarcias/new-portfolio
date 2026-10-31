// The shapes the radar and the chart share: the slice of the platform a
// sector takes, the arc of its rim, a holocron's diamond, and the look of
// each planet's ground, a small tile that repeats.

// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { platformRadius } from './world/arena';
import { hubRadius, sectorAngle } from './world/biomes';

// A point at a distance and an angle from the middle, as the map draws it:
// angle 0 is the way the ships start facing, up.
export const at = (radius: number, angle: number) =>
  `${(Math.sin(angle) * radius).toFixed(2)} ${(-Math.cos(angle) * radius).toFixed(2)}`;

export function wedge(angle: number) {
  const from = angle - sectorAngle / 2;
  const to = angle + sectorAngle / 2;
  return [
    `M ${at(hubRadius, from)}`,
    `L ${at(platformRadius, from)}`,
    `A ${platformRadius} ${platformRadius} 0 0 1 ${at(platformRadius, to)}`,
    `L ${at(hubRadius, to)}`,
    `A ${hubRadius} ${hubRadius} 0 0 0 ${at(hubRadius, from)}`,
    'Z',
  ].join(' ');
}

// The sector's stretch of the platform's rim, a little short at each end.
export function rim(angle: number, radius = platformRadius) {
  const from = angle - sectorAngle / 2 + 0.03;
  const to = angle + sectorAngle / 2 - 0.03;
  return `M ${at(radius, from)} A ${radius} ${radius} 0 0 1 ${at(radius, to)}`;
}

export const diamond = (x: number, z: number, size: number) =>
  `M ${x.toFixed(2)} ${(z - size).toFixed(2)} l ${size} ${size} l ${-size} ${size} l ${-size} ${-size} Z`;

export function Texture({ id, accent }: { id: SectionId; accent: string }) {
  switch (id) {
    case 'about':
      // Dunes.
      return (
        <path
          d="M0 6Q3 3 6 6T12 6"
          fill="none"
          stroke={accent}
          strokeWidth="0.9"
        />
      );
    case 'experience':
      // Blocks of the city.
      return (
        <>
          <rect x="1.5" y="1.5" width="3.5" height="3.5" fill={accent} />
          <rect x="7" y="7" width="3.5" height="3.5" fill={accent} />
        </>
      );
    case 'education':
      // Pools of the swamp.
      return (
        <>
          <circle cx="3" cy="3.5" r="1.6" fill={accent} />
          <circle cx="9" cy="8.5" r="1.1" fill={accent} />
        </>
      );
    case 'courses':
      // Waves.
      return (
        <path
          d="M0 3Q3 0 6 3T12 3M0 9Q3 6 6 9T12 9"
          fill="none"
          stroke={accent}
          strokeWidth="0.9"
        />
      );
    case 'projects':
      // Trees and flowers of the meadows.
      return (
        <>
          <circle cx="3" cy="4" r="1.6" fill={accent} />
          <circle cx="9" cy="9" r="1.6" fill={accent} />
          <circle cx="8.5" cy="2.5" r="0.7" fill={accent} />
        </>
      );
    case 'contributing':
      // The forest.
      return <path d="M3 1l2.5 5h-5zM9 6l2.5 5h-5z" fill={accent} />;
    case 'contact':
      // Snowflakes.
      return (
        <path
          d="M6 2v8M2 6h8M3.2 3.2l5.6 5.6M8.8 3.2l-5.6 5.6"
          fill="none"
          stroke={accent}
          strokeWidth="0.8"
        />
      );
  }
}
