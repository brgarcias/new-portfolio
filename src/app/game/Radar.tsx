'use client';

// HOOKS
import { useEffect, useRef, type CSSProperties } from 'react';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { diamond, Texture, wedge } from './chart-parts';
import { radarRing, radarSpan } from './instruments';
import { overlay } from './overlay';
import { flora, holocrons, pads, platformRadius, props } from './world/arena';
import { biomes, hubRadius } from './world/biomes';

const registerMap = (element: HTMLDivElement | null) => {
  overlay.radarMap = element;
};
const registerNorth = (element: HTMLDivElement | null) => {
  overlay.radarNorth = element;
};
const registerEdges = (element: HTMLDivElement | null) => {
  overlay.radarEdges = element;
};

// The bezel's ticks, every ten degrees, longer every thirty.
const ticks = Array.from({ length: 36 }, (_, index) => index * 10);
const solid = flora.filter((item) => item.solid);
const hidden = { display: 'none' };
const half = radarSpan / 2;

interface RadarProps {
  activePad: SectionId | null;
  visited: SectionId[];
  found: SectionId[];
  course: SectionId | null;
}

// The radar in a corner of the HUD: the world around the ship, which sits
// in the middle facing up, as far as the ring reaches. Each part that
// moves is a layer of its own, so the compositor moves it without drawing
// it again: the map, drawn once, which the frame loop turns and slides
// under the ship (instruments.ts); the sweep, which turns by itself; the
// mark of the way the flight started, on the bezel; and a chevron on the
// ring for each pad and holocron out of reach, and for the course. The
// bezel, the range and the ship are drawn once, over it all.
export default function Radar({
  activePad,
  visited,
  found,
  course,
}: Readonly<RadarProps>) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      overlay.radarSize = element.clientWidth;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      overlay.radarSize = 0;
    };
  }, []);

  const stateOf = (id: SectionId) => {
    if (id === activePad) return 'active';
    return visited.includes(id) ? 'visited' : undefined;
  };

  return (
    <div ref={root} className="radar" aria-hidden="true">
      <div className="radar__scope">
        <div ref={registerMap} className="radar__map">
          <svg viewBox={`${-half} ${-half} ${radarSpan} ${radarSpan}`}>
            <defs>
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
            {holocrons.map((holocron) =>
              found.includes(holocron.id) ? null : (
                <path
                  key={holocron.id}
                  className="radar__holocron"
                  d={diamond(holocron.x, holocron.z, 3.4)}
                />
              ),
            )}
          </svg>
        </div>
        <div className="radar__sweep" />
      </div>
      <svg className="radar__face" viewBox="-100 -100 200 200">
        <circle className="radar__range" r={radarRing / 2} />
        <circle className="radar__ring" r={radarRing} />
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
        <path className="radar__cone" d="M0 0L-15 -44H15Z" />
        <path className="radar__arrow" d="M0 -7.5L5.5 6.5L0 3.6L-5.5 6.5Z" />
      </svg>
      <div ref={registerNorth} className="radar__north">
        <span />
      </div>
      <div ref={registerEdges} className="radar__edges">
        {pads.map((pad) => (
          <span
            key={pad.id}
            data-kind="pad"
            data-id={pad.id}
            style={
              {
                ...hidden,
                '--c': biomes[pad.id].accent,
              } as CSSProperties
            }
          />
        ))}
        {holocrons.map((holocron) => (
          <span
            key={holocron.id}
            className="is-holocron"
            data-kind="holocron"
            data-id={holocron.id}
            style={hidden}
          />
        ))}
        <span className="is-course" data-kind="course" style={hidden} />
      </div>
    </div>
  );
}
