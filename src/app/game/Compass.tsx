'use client';

// HOOKS
import { useEffect, useRef, type CSSProperties } from 'react';
// GAME
import { compassScale } from './instruments';
import { overlay } from './overlay';
import { holocrons, pads } from './world/arena';
import { biomes } from './world/biomes';

const registerTape = (element: HTMLDivElement | null) => {
  overlay.compassTape = element;
};
const registerMarks = (element: HTMLDivElement | null) => {
  overlay.compassMarks = element;
};
const registerReadout = (element: HTMLSpanElement | null) => {
  overlay.compassReadout = element;
};

// The tape runs from 90 degrees before the start to 90 after a full turn,
// so it never shows an end, with a figure every 30 degrees.
const figures = Array.from({ length: 19 }, (_, index) => -90 + index * 30);
const hidden = { display: 'none' };

// The compass across the top of the HUD: a tape of bearings that slides
// as the ship turns, the bearing under the caret, and marks for the pads
// and the holocrons ahead, and for the course, which stays on the tape's
// edge, with its distance, when it lies behind. The frame loop moves it
// all (instruments.ts); here it only measures its window.
export default function Compass() {
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () => {
      overlay.compassHalf = element.clientWidth / 2 / compassScale;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      overlay.compassHalf = 0;
    };
  }, []);

  return (
    <div className="compass" aria-hidden="true">
      <div ref={frame} className="compass__window">
        <div ref={registerTape} className="compass__tape">
          {figures.map((bearing) => (
            <span
              key={bearing}
              className="compass__figure"
              data-major={bearing % 90 === 0 ? '' : undefined}
              style={{ left: `${(bearing + 90) * compassScale}px` }}
            >
              {String((bearing + 360) % 360).padStart(3, '0')}
            </span>
          ))}
        </div>
        <div ref={registerMarks} className="compass__marks">
          {pads.map((pad) => (
            <span
              key={pad.id}
              className="compass__mark"
              data-kind="pad"
              data-id={pad.id}
              style={
                {
                  ...hidden,
                  '--accent': biomes[pad.id].accent,
                } as CSSProperties
              }
            />
          ))}
          {holocrons.map((holocron) => (
            <span
              key={holocron.id}
              className="compass__mark"
              data-kind="holocron"
              data-id={holocron.id}
              style={hidden}
            />
          ))}
          <span className="compass__mark" data-kind="course" style={hidden}>
            <small />
          </span>
        </div>
      </div>
      <span className="compass__caret" />
      <p className="compass__readout">
        <span ref={registerReadout} className="g-num">
          000
        </span>
        °
      </p>
    </div>
  );
}
