'use client';

// HOOKS
import { useEffect } from 'react';
// THREE
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
// GAME
import {
  beginPhoto,
  endPhoto,
  photo,
  startClock,
  stepPhoto,
  stopClock,
} from './photo';
import { quiet } from './sound';
import { useReducedMotion } from './useMediaQuery';

// Inside the canvas, after the ship: stops the world when the photo mode opens,
// and moves the camera each frame by the time that really passed, as the
// scene's own clock stands still.
export default function PhotoRig({
  active,
  hover,
}: Readonly<{ active: boolean; hover: number }>) {
  const get = useThree((state) => state.get);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    const { camera, clock } = get();
    if (camera instanceof THREE.PerspectiveCamera) beginPhoto(camera, hover);
    stopClock(clock);
    quiet();
    return () => {
      endPhoto();
      startClock(clock);
    };
  }, [active, get, hover]);

  useFrame(({ camera }) => {
    if (!photo.active || !(camera instanceof THREE.PerspectiveCamera)) return;
    const time = performance.now();
    const dt = Math.min((time - photo.lastFrame) / 1000, 0.1);
    photo.lastFrame = time;
    stepPhoto(camera, dt, reduced);
  });

  return null;
}
