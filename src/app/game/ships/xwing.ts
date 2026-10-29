import * as THREE from 'three';
import {
  assemble,
  ball,
  box,
  engine,
  glass,
  mirrored,
  nose,
  paint,
  tube,
} from './parts';

const hull = paint('#dcdfe5');
const dark = paint('#8d939e');
const red = paint('#c62f3b');
const blue = paint('#3f7fd9');

// One of the four wings, hinged at the back of the hull and tilted open,
// with its stripe, its cannon at the tip and its engine at the root.
function wing(x: number, y: number, tilt: number) {
  const side = Math.sign(x);
  const group = new THREE.Group();
  group.position.set(0, y, 1.1);
  group.rotation.z = tilt;
  group.add(
    box([2.9, 0.1, 1.25], hull, [x, 0, 0]),
    box([0.55, 0.12, 1.25], red, [side * 1.9, 0, 0]),
    tube(0.06, 0.06, 2.1, 6, dark, [side * 2.85, 0.08, -0.6]),
    tube(0.3, 0.34, 1.4, 10, dark, [side * 0.95, 0, 0.5]),
    engine(0.22, '#ff6b81', [side * 0.95, 0, 1.25]),
  );
  return group;
}

export function buildXWing() {
  return assemble(
    box([1.0, 0.8, 3.2], hull, [0, 0, 0.5]),
    nose(0.52, 2.6, 8, hull, [0, 0, -2.4]),
    box([0.58, 0.42, 1.1], glass(), [0, 0.58, -0.1]),
    ball(0.3, 8, blue, [0, 0.55, 1.2]),
    box([0.5, 0.2, 0.6], dark, [0, -0.5, 1.2]),
    ...mirrored((x) => wing(x, 0.28, Math.sign(x) * 0.21), 1.9),
    ...mirrored((x) => wing(x, -0.28, Math.sign(x) * -0.21), 1.9),
  );
}
