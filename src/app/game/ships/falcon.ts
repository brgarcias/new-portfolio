import {
  assemble,
  ball,
  box,
  glass,
  mirrored,
  paint,
  post,
  tube,
} from './parts';

const hull = paint('#c3c7cd');
const grey = paint('#8e939b');
const dark = paint('#5d626b');

export function buildFalcon() {
  // The engines are a strip along the back, not a round mouth.
  const exhaust = box(
    [3.0, 0.28, 0.2],
    paint('#5ec8ff', {
      emissive: '#5ec8ff',
      roughness: 1,
      metalness: 0,
    }).clone(),
    [0, 0, 2.8],
  );
  exhaust.userData.engine = true;

  const ship = assemble(
    post(2.75, 2.75, 0.62, 16, hull),
    ball(2.05, 14, hull, [0, 0.3, 0.15], [1, 0.36, 1]),
    ball(2.05, 14, hull, [0, -0.3, 0.15], [1, 0.3, 1]),
    ...mirrored((x) => box([0.95, 0.56, 2.7], hull, [x, 0, -3.1]), 1.05),
    ...mirrored((x) => box([0.95, 0.4, 0.5], grey, [x, 0, -4.4]), 1.05),
    tube(0.46, 0.46, 2.3, 10, hull, [2.15, 0.18, -1.3]),
    ball(0.44, 10, glass(), [2.15, 0.18, -2.4]),
    post(0.06, 0.06, 0.4, 6, dark, [-0.95, 0.5, 0.5]),
    post(0.58, 0.58, 0.08, 10, grey, [-0.95, 0.66, 0.5], [-0.7, 0, 0.3]),
    box([0.8, 0.18, 1.0], grey, [-0.4, 0.78, -0.5]),
    box([0.5, 0.14, 0.7], dark, [0.6, 0.76, 0.9]),
    box([0.9, 0.14, 0.5], grey, [0.2, -0.76, 0.6]),
    ...mirrored(
      (x) => post(0.55, 0.55, 0.5, 10, grey, [x, 0, 0.5], [0, 0, Math.PI / 2]),
      2.95,
    ),
    exhaust,
  );
  ship.scale.setScalar(0.85);
  return ship;
}
