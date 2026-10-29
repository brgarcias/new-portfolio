'use client';

// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { flora, pads, platformRadius, props } from './world/arena';
import { biomes, hubRadius, sectorAngle } from './world/biomes';

// The slice of the map a sector takes, from the hub to the edge.
function wedge(angle: number) {
  const from = angle - sectorAngle / 2;
  const to = angle + sectorAngle / 2;
  const at = (r: number, a: number) =>
    `${(Math.sin(a) * r).toFixed(1)} ${(-Math.cos(a) * r).toFixed(1)}`;
  const inner = hubRadius;
  const outer = platformRadius;
  return [
    `M ${at(inner, from)}`,
    `L ${at(outer, from)}`,
    `A ${outer} ${outer} 0 0 1 ${at(outer, to)}`,
    `L ${at(inner, to)}`,
    `A ${inner} ${inner} 0 0 0 ${at(inner, from)}`,
    'Z',
  ].join(' ');
}

// The beam the radar sweeps around: a slice from the middle to the edge.
const sweepAngle = 0.9;
const sweep = [
  'M 0 0',
  `L 0 ${-platformRadius}`,
  `A ${platformRadius} ${platformRadius} 0 0 1 ${(Math.sin(sweepAngle) * platformRadius).toFixed(1)} ${(-Math.cos(sweepAngle) * platformRadius).toFixed(1)}`,
  'Z',
].join(' ');

// The look of each planet's ground on the map: a small tile that repeats.
function Texture({ id, accent }: { id: SectionId; accent: string }) {
  switch (id) {
    case 'about':
      // Dunes.
      return (
        <path
          d="M0 6Q3 3 6 6T12 6"
          fill="none"
          stroke={accent}
          strokeWidth="1"
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
          strokeWidth="1"
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

interface RadarProps {
  activePad: SectionId | null;
  visited: SectionId[];
  // The map, large, names the planets.
  large?: boolean;
  // Tells the two radars' patterns apart on the page.
  scope: string;
  registerShip: (element: SVGGElement | null) => void;
}

// A map of the world, with the sectors in their planets' colors and
// textures, the props, the pads and the ship, which the frame loop moves.
// North is up: the way the ships start facing. Small, it sits in a corner
// of the HUD and sweeps like a radar; large, it is the map that opens over
// the flight.
export default function Radar({
  activePad,
  visited,
  large = false,
  scope,
  registerShip,
}: Readonly<RadarProps>) {
  const t = useI18n().messages.game;
  const span = platformRadius + 8;
  const stateOf = (id: SectionId) => {
    if (id === activePad) return 'active';
    return visited.includes(id) ? 'visited' : undefined;
  };

  return (
    <svg
      className={large ? 'radar radar--large' : 'radar'}
      viewBox={`${-span} ${-span} ${2 * span} ${2 * span}`}
      role="img"
      aria-label={t.radar}
      aria-hidden={large ? undefined : true}
    >
      <defs>
        {pads.map((pad) => (
          <pattern
            key={pad.id}
            id={`${scope}-${pad.id}`}
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <Texture id={pad.id} accent={biomes[pad.id].accent} />
          </pattern>
        ))}
        <linearGradient id={`${scope}-sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e8e9ff" stopOpacity="0" />
          <stop offset="1" stopColor="#e8e9ff" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <circle className="radar__deck" r={platformRadius} />
      {pads.map((pad) => (
        <path
          key={pad.id}
          className="radar__sector"
          data-id={pad.id}
          d={wedge(pad.angle)}
          fill={biomes[pad.id].accent}
        />
      ))}
      {pads.map((pad) => (
        <path
          key={pad.id}
          className="radar__texture"
          d={wedge(pad.angle)}
          fill={`url(#${scope}-${pad.id})`}
        />
      ))}
      <circle className="radar__hub" r={hubRadius} />
      {props.map((prop, index) => (
        <circle
          key={index}
          className="radar__prop"
          cx={prop.x.toFixed(1)}
          cy={prop.z.toFixed(1)}
          r={Math.max(1.3, prop.r * 0.6).toFixed(1)}
        />
      ))}
      {flora
        .filter((item) => item.solid)
        .map((item, index) => (
          <circle
            key={index}
            className="radar__prop"
            cx={item.x.toFixed(1)}
            cy={item.z.toFixed(1)}
            r="1"
          />
        ))}
      {pads.map((pad) => (
        <circle
          key={pad.id}
          className="radar__pad"
          data-state={stateOf(pad.id)}
          cx={pad.x}
          cy={pad.z}
          r={pad.r}
        />
      ))}
      {large &&
        pads.map((pad) => {
          const degrees = (pad.angle * 180) / Math.PI;
          const flipped = degrees > 90 && degrees < 270;
          const x = Math.sin(pad.angle) * 97;
          const y = -Math.cos(pad.angle) * 97;
          return (
            <text
              key={pad.id}
              className="radar__name"
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              textAnchor="middle"
              transform={`rotate(${(flipped ? degrees + 180 : degrees).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}
            >
              {biomes[pad.id].planet}
            </text>
          );
        })}
      {!large && (
        <path
          className="radar__sweep"
          d={sweep}
          fill={`url(#${scope}-sweep)`}
        />
      )}
      <g ref={registerShip} className="radar__ship">
        <path className="radar__cone" d="M0 -6 L13 -34 L-13 -34 Z" />
        <polygon points="0,-9 6,7 0,4 -6,7" />
      </g>
    </svg>
  );
}
