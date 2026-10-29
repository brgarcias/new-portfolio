'use client';

// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { overlay } from './overlay';
import { pads, platformRadius } from './world/arena';

const register = (element: SVGGElement | null) => {
  overlay.radarShip = element;
};

interface RadarProps {
  activePad: SectionId | null;
  visited: SectionId[];
}

// A map of the arena in a corner, with the pads and the ship, which the
// frame loop moves. North is up: the way the ships start facing.
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
