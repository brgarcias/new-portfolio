'use client';

// HOOKS
import { useEffect } from 'react';
// THREE
import { useThree } from '@react-three/fiber';

// The sharpest a photo is drawn: twice the page, or the screen's own density if
// that is more, up to about 4K across.
const widest = 3840;

// Takes a picture of the flight: draws one frame, sharper than the screen's, and
// hands the canvas over right away, so the canvas does not have to keep its
// drawing between frames. The resolution goes back right after, with one more
// frame drawn, so the canvas never shows empty. The photo mode calls it.
export const snapshot = {
  take: null as (<T>(develop: (canvas: HTMLCanvasElement) => T) => T) | null,
};

export default function Snapshot() {
  const get = useThree((state) => state.get);
  useEffect(() => {
    snapshot.take = (develop) => {
      const { gl, scene, camera, size } = get();
      const ratio = gl.getPixelRatio();
      const sharp = Math.max(
        ratio,
        Math.min(Math.max(window.devicePixelRatio, 2), widest / size.width),
      );
      gl.setPixelRatio(sharp);
      gl.render(scene, camera);
      const result = develop(gl.domElement);
      gl.setPixelRatio(ratio);
      gl.render(scene, camera);
      return result;
    };
    return () => {
      snapshot.take = null;
    };
  }, [get]);
  return null;
}
