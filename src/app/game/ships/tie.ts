import * as THREE from 'three';
import {
  assemble,
  ball,
  box,
  engine,
  glass,
  mirrored,
  paint,
  post,
  tube,
} from './parts';

const grey = paint('#5f6774');
const dark = paint('#2f3440');

// One of the two solar panels: a hexagon standing on its pylon, with its
// hub and spars.
function panel(x: number) {
  const across: [number, number, number] = [0, 0, Math.PI / 2];
  const group = new THREE.Group();
  group.add(
    post(2.05, 2.05, 0.1, 6, dark, [x, 0, 0], across),
    post(0.42, 0.42, 0.26, 8, grey, [x, 0, 0], across),
    box([0.16, 3.7, 0.16], grey, [x, 0, 0]),
    box([0.16, 0.16, 3.3], grey, [x, 0, 0]),
    box([1.35, 0.34, 0.34], grey, [x * 0.67, 0, 0]),
  );
  return group;
}

export function buildTieFighter() {
  return assemble(
    ball(0.98, 12, grey),
    tube(0.52, 0.52, 0.16, 8, glass(), [0, 0, -0.93]),
    post(0.32, 0.32, 0.16, 8, dark, [0, 0.98, 0]),
    ...mirrored(panel, 2.25),
    ...mirrored((x) => engine(0.24, '#ff8a4c', [x, -0.22, 0.92]), 0.36),
  );
}
