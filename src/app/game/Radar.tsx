'use client';

// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { overlay } from './overlay';
import { pads, platformRadius } from './world/arena';
import { biomes, hubRadius, sectorAngle } from './world/biomes';

const register = (element: SVGGElement | null) => {
  overlay.radarShip = element;
};

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

interface RadarProps {
  activePad: SectionId | null;
  visited: SectionId[];
}

// A map of the arena in a corner, with the sectors in their planets'
// colors, the pads and the ship, which the frame loop moves. North is up:
// the way the ships start facing.
export default function Radar({ activePad, visited }: Readonly<RadarProps>) {
  const t = useI18n().messages.game;
  const span = platformRadius + 8;
  const stateOf = (id: SectionId) => {
    if (id === activePad) return 'active';
    return visited.includes(id) ? 'visited' : undefined;
  };

  return (
    <svg
      className="radar"
      viewBox={`${-span} ${-span} ${2 * span} ${2 * span}`}
      role="img"
      aria-label={t.radar}
    >
      <circle className="radar__deck" r={platformRadius} />
      {pads.map((pad) => (
        <path
          key={pad.id}
          className="radar__sector"
          d={wedge(pad.angle)}
          fill={biomes[pad.id].accent}
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
      <g ref={register} className="radar__ship">
        <polygon points="0,-9 6,7 0,4 -6,7" />
      </g>
    </svg>
  );
}
