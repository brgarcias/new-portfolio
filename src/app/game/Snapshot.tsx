'use client';

// HOOKS
import { useEffect } from 'react';
// THREE
import { useThree } from '@react-three/fiber';

// Takes a picture of the flight: draws one frame and reads the canvas, so
// the canvas does not have to keep its drawing between frames. The HUD
// calls it in photo mode.
export const snapshot = {
  take: null as (() => string) | null,
};

export default function Snapshot() {
  const get = useThree((state) => state.get);
  useEffect(() => {
    snapshot.take = () => {
      const { gl, scene, camera } = get();
      gl.render(scene, camera);
      return gl.domElement.toDataURL('image/png');
    };
    return () => {
      snapshot.take = null;
    };
  }, [get]);
  return null;
}
