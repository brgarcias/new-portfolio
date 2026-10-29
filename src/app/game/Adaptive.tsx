'use client';

// HOOKS
import { useRef } from 'react';
// THREE
import { useFrame, useThree } from '@react-three/fiber';

// Lowers the canvas's resolution while the frames come slow, as on a weak
// device or a software renderer, and raises it back while they come quick:
// a quarter at a time, between half a pixel per pixel and the canvas's own
// ratio. Fewer pixels to draw is what helps most there. Half a second of
// slow frames lowers it; four seconds of quick ones raise it.
export default function Adaptive() {
  const setDpr = useThree((three) => three.setDpr);
  // The canvas's own ratio, which R3F keeps from before any change.
  const initial = useThree((three) => three.viewport.initialDpr);
  const ratio = useRef(initial);
  const slow = useRef(0);
  const quick = useRef(0);

  useFrame((_, delta) => {
    if (delta > 1 / 30) {
      slow.current += delta;
      quick.current = 0;
    } else if (delta < 1 / 55) {
      quick.current += delta;
      slow.current = 0;
    }
    if (slow.current > 0.5 && ratio.current > 0.5) {
      ratio.current = Math.max(0.5, ratio.current * 0.75);
      setDpr(ratio.current);
      slow.current = 0;
    } else if (quick.current > 4 && ratio.current < initial) {
      ratio.current = Math.min(initial, ratio.current / 0.75);
      setDpr(ratio.current);
      quick.current = 0;
    }
  });

  return null;
}
