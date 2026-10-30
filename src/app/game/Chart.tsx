'use client';

// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { at, diamond, rim, Texture, wedge } from './chart-parts';
import { overlay } from './overlay';
import { flora, holocrons, pads, platformRadius, props } from './world/arena';
import { biomes, hubRadius, sectorAngle } from './world/biomes';

const registerShip = (element: SVGGElement | null) => {
  overlay.chartShip = element;
};
const registerCourse = (element: SVGLineElement | null) => {
  overlay.chartCourse = element;
};

const solid = flora.filter((item) => item.solid);
// The bearing ring: a tick every five degrees, longer every fifteen, and a
// figure every forty-five.
const bearings = Array.from({ length: 72 }, (_, index) => index * 5);
const rings = [25, 50, 75, 100];

interface ChartProps {
  activePad: SectionId | null;
  visited: SectionId[];
  found: SectionId[];
  course: SectionId | null;
  label: string;
}

// The navigation chart: the whole platform, north up as the flight
// started, with the bearing ring around it, the distance rings, the
// sectors in their planets' colors and textures, the pads numbered as the
// site's sections, the holocrons, the course and the ship, which the frame
// loop moves (instruments.ts).
export default function Chart({
  activePad,
  visited,
  found,
  course,
  label,
}: Readonly<ChartProps>) {
  const stateOf = (id: SectionId) => {
    if (id === activePad) return 'active';
    return visited.includes(id) ? 'visited' : undefined;
  };

  return (
    <svg
      className="chart"
      viewBox="-136 -136 272 272"
      role="img"
      aria-label={label}
    >
      <defs>
        {pads.map((pad) => (
          <pattern
            key={pad.id}
            id={`chart-${pad.id}`}
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <Texture id={pad.id} accent={biomes[pad.id].accent} />
          </pattern>
        ))}
        <radialGradient id="chart-glow">
          <stop offset="0.55" stopColor="#5c5edc" stopOpacity="0.16" />
          <stop offset="1" stopColor="#5c5edc" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="chart__glow" r="136" fill="url(#chart-glow)" />
      <g className="chart__bearings">
        {bearings.map((degrees) => {
          const angle = (degrees * Math.PI) / 180;
          const major = degrees % 45 === 0;
          const outer = major ? 126 : degrees % 15 === 0 ? 123.5 : 121.5;
          return (
            <line
              key={degrees}
              className={major ? 'is-major' : undefined}
              x1={(Math.sin(angle) * 118).toFixed(2)}
              y1={(-Math.cos(angle) * 118).toFixed(2)}
              x2={(Math.sin(angle) * outer).toFixed(2)}
              y2={(-Math.cos(angle) * outer).toFixed(2)}
            />
          );
        })}
        {bearings
          .filter((degrees) => degrees % 45 === 0)
          .map((degrees) => {
            const angle = (degrees * Math.PI) / 180;
            return (
              <text
                key={degrees}
                className="chart__bearing"
                x={(Math.sin(angle) * 131).toFixed(2)}
                y={(-Math.cos(angle) * 131).toFixed(2)}
              >
                {String(degrees).padStart(3, '0')}
              </text>
            );
          })}
        <circle className="chart__ring" r="118" />
      </g>
      <circle className="chart__deck" r={platformRadius} />
      {pads.map((pad) => (
        <path
          key={pad.id}
          className="chart__sector"
          data-id={pad.id}
          d={wedge(pad.angle)}
          fill={biomes[pad.id].accent}
        />
      ))}
      {pads.map((pad) => (
        <path
          key={pad.id}
          className="chart__texture"
          d={wedge(pad.angle)}
          fill={`url(#chart-${pad.id})`}
        />
      ))}
      {rings.map((radius) => (
        <circle key={radius} className="chart__grid" r={radius} />
      ))}
      {pads.map((pad) => {
        const edge = pad.angle + sectorAngle / 2;
        return (
          <path
            key={pad.id}
            className="chart__border"
            d={`M ${at(hubRadius, edge)} L ${at(platformRadius, edge)}`}
          />
        );
      })}
      {rings.map((radius) => (
        <text
          key={radius}
          className="chart__distance"
          x={(Math.sin(sectorAngle / 2) * radius + 2).toFixed(2)}
          y={(-Math.cos(sectorAngle / 2) * radius).toFixed(2)}
        >
          {radius}
        </text>
      ))}
      {pads.map((pad) => (
        <path
          key={pad.id}
          className="chart__rim"
          d={rim(pad.angle)}
          stroke={biomes[pad.id].accent}
        />
      ))}
      <circle className="chart__hub" r={hubRadius} />
      {props.map((prop, index) => (
        <circle
          key={index}
          className="chart__prop"
          cx={prop.x.toFixed(1)}
          cy={prop.z.toFixed(1)}
          r={Math.max(1.1, prop.r * 0.55).toFixed(1)}
        />
      ))}
      {solid.map((item, index) => (
        <circle
          key={index}
          className="chart__prop"
          cx={item.x.toFixed(1)}
          cy={item.z.toFixed(1)}
          r="0.9"
        />
      ))}
      <line
        ref={registerCourse}
        className="chart__course"
        style={{ display: 'none' }}
      />
      {pads.map((pad, index) => (
        <g
          key={pad.id}
          className="chart__pad"
          data-state={stateOf(pad.id)}
          data-course={course === pad.id ? '' : undefined}
          style={{ color: biomes[pad.id].accent }}
        >
          <circle className="chart__halo" cx={pad.x} cy={pad.z} r={pad.r + 5} />
          <circle className="chart__disc" cx={pad.x} cy={pad.z} r={pad.r} />
          <text className="chart__index" x={pad.x} y={pad.z}>
            {String(index + 1).padStart(2, '0')}
          </text>
        </g>
      ))}
      {holocrons.map((holocron) => (
        <path
          key={holocron.id}
          className="chart__holocron"
          data-state={found.includes(holocron.id) ? 'found' : undefined}
          d={diamond(holocron.x, holocron.z, 4.4)}
        />
      ))}
      {pads.map((pad) => {
        const degrees = (pad.angle * 180) / Math.PI;
        const flipped = degrees > 90 && degrees < 270;
        const x = Math.sin(pad.angle) * 98;
        const y = -Math.cos(pad.angle) * 98;
        return (
          <text
            key={pad.id}
            className="chart__name"
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            transform={`rotate(${(flipped ? degrees + 180 : degrees).toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})`}
          >
            {biomes[pad.id].planet}
          </text>
        );
      })}
      <g ref={registerShip} className="chart__ship">
        <circle className="chart__ship-ring" r="8" />
        <path className="chart__ship-cone" d="M0 0L-11 -34H11Z" />
        <path className="chart__ship-arrow" d="M0 -8L6 7L0 4L-6 7Z" />
      </g>
    </svg>
  );
}
