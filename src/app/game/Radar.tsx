'use client';

// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { diamond, Texture, wedge } from './chart-parts';
import { radarRing } from './instruments';
import { overlay } from './overlay';
import { flora, holocrons, pads, platformRadius, props } from './world/arena';
import { biomes, hubRadius } from './world/biomes';

const registerWorld = (element: SVGGElement | null) => {
  overlay.radarWorld = element;
};
const registerNorth = (element: SVGGElement | null) => {
  overlay.radarNorth = element;
};
const registerEdges = (element: SVGGElement | null) => {
  overlay.radarEdges = element;
};

// The bezel's ticks, every ten degrees, longer every thirty.
const ticks = Array.from({ length: 36 }, (_, index) => index * 10);
const solid = flora.filter((item) => item.solid);
const chevron = 'M0 -5L4.2 2.6L0 0.6L-4.2 2.6Z';
const hidden = { display: 'none' };

// The beam the radar sweeps around: a slice from the middle to the ring.
const sweep = `M0 0L0 ${-radarRing}A${radarRing} ${radarRing} 0 0 1 ${(Math.sin(0.85) * radarRing).toFixed(2)} ${(-Math.cos(0.85) * radarRing).toFixed(2)}Z`;

interface RadarProps {
  activePad: SectionId | null;
  visited: SectionId[];
  found: SectionId[];
  course: SectionId | null;
}

// The radar in a corner of the HUD: the world around the ship, which sits
// in the middle facing up, as far as the ring reaches. The frame loop turns
// and moves the map under it (instruments.ts), turns the mark of the way
// the flight started on the bezel, and puts a chevron on the ring for each
// pad and holocron out of reach, and for the course. It sweeps, slowly.
export default function Radar({
  activePad,
  visited,
  found,
  course,
}: Readonly<RadarProps>) {
  const stateOf = (id: SectionId) => {
    if (id === activePad) return 'active';
    return visited.includes(id) ? 'visited' : undefined;
  };

  return (
    <svg
      className="radar"
      viewBox="-100 -100 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="radar-clip">
          <circle r={radarRing} />
        </clipPath>
        {pads.map((pad) => (
          <pattern
            key={pad.id}
            id={`radar-${pad.id}`}
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <Texture id={pad.id} accent={biomes[pad.id].accent} />
          </pattern>
        ))}
        <linearGradient id="radar-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bfe6ff" stopOpacity="0" />
          <stop offset="1" stopColor="#bfe6ff" stopOpacity="0.32" />
        </linearGradient>
      </defs>
      <circle className="radar__glass" r="98" />
      <g clipPath="url(#radar-clip)">
        <g ref={registerWorld} className="radar__world">
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
              fill={`url(#radar-${pad.id})`}
            />
          ))}
          <circle className="radar__rim" r={platformRadius} />
          <circle className="radar__hub" r={hubRadius} />
          {props.map((prop, index) => (
            <circle
              key={index}
              className="radar__prop"
              cx={prop.x.toFixed(1)}
              cy={prop.z.toFixed(1)}
              r={Math.max(1.4, prop.r * 0.7).toFixed(1)}
            />
          ))}
          {solid.map((item, index) => (
            <circle
              key={index}
              className="radar__prop"
              cx={item.x.toFixed(1)}
              cy={item.z.toFixed(1)}
              r="1.2"
            />
          ))}
          {pads.map((pad) => (
            <circle
              key={pad.id}
              className="radar__pad"
              data-state={stateOf(pad.id)}
              data-course={course === pad.id ? '' : undefined}
              cx={pad.x}
              cy={pad.z}
              r={pad.r}
              style={{ stroke: biomes[pad.id].accent }}
            />
          ))}
          {holocrons.map((holocron) => (
            <path
              key={holocron.id}
              className="radar__holocron"
              data-found={found.includes(holocron.id) ? '' : undefined}
              d={diamond(holocron.x, holocron.z, 3.4)}
            />
          ))}
        </g>
        <circle className="radar__range" r={radarRing / 2} />
        <path className="radar__sweep" d={sweep} fill="url(#radar-sweep)" />
      </g>
      <g className="radar__bezel">
        {ticks.map((degrees) => {
          const angle = (degrees * Math.PI) / 180;
          const outer = degrees % 30 === 0 ? 97 : 94;
          return (
            <line
              key={degrees}
              className={degrees % 30 === 0 ? 'is-major' : undefined}
              x1={(Math.sin(angle) * 90).toFixed(2)}
              y1={(-Math.cos(angle) * 90).toFixed(2)}
              x2={(Math.sin(angle) * outer).toFixed(2)}
              y2={(-Math.cos(angle) * outer).toFixed(2)}
            />
          );
        })}
      </g>
      <g ref={registerNorth} className="radar__north">
        <path d="M0 -89.5L3.6 -96H-3.6Z" />
      </g>
      <g ref={registerEdges} className="radar__edges">
        {pads.map((pad) => (
          <path
            key={pad.id}
            data-kind="pad"
            data-id={pad.id}
            d={chevron}
            style={{ ...hidden, fill: biomes[pad.id].accent }}
          />
        ))}
        {holocrons.map((holocron) => (
          <path
            key={holocron.id}
            className="is-holocron"
            data-kind="holocron"
            data-id={holocron.id}
            d={chevron}
            style={hidden}
          />
        ))}
        <path
          className="is-course"
          data-kind="course"
          d="M0 -7L6 4L0 1L-6 4Z"
          style={hidden}
        />
      </g>
      <g className="radar__self">
        <path className="radar__cone" d="M0 0L-15 -44H15Z" />
        <path className="radar__arrow" d="M0 -7.5L5.5 6.5L0 3.6L-5.5 6.5Z" />
      </g>
    </svg>
  );
}
