'use client';

// HOOKS
import { useEffect } from 'react';
// THREE
import { useThree } from '@react-three/fiber';

// Takes a picture of the flight: draws one frame and reads the canvas, so
// the canvas does not have to keep its drawing between frames. The frame
// is drawn at the canvas's own resolution, even while slow frames have it
// draw fewer pixels, and the resolution goes back right after, with one
// more frame drawn, so the canvas never shows empty. The HUD calls it in
// photo mode.
export const snapshot = {
  take: null as (() => string) | null,
};

export default function Snapshot() {
  const get = useThree((state) => state.get);
  useEffect(() => {
    snapshot.take = () => {
      const { gl, scene, camera, viewport } = get();
      const ratio = gl.getPixelRatio();
      const full = Math.max(ratio, viewport.initialDpr);
      if (full !== ratio) gl.setPixelRatio(full);
      gl.render(scene, camera);
      const picture = gl.domElement.toDataURL('image/png');
      if (full !== ratio) {
        gl.setPixelRatio(ratio);
        gl.render(scene, camera);
      }
      return picture;
    };
    return () => {
      snapshot.take = null;
    };
  }, [get]);
  return null;
}
