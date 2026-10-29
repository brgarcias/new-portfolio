import {
  assemble,
  ball,
  box,
  engine,
  glass,
  mirrored,
  paint,
  tube,
  wedge,
} from './parts';

const red = paint('#c8332f');
const white = paint('#e7eaf0');
const dark = paint('#3b4049');

export function buildAWing() {
  return assemble(
    wedge(0.32, 1.0, 4.0, 1.45, 0.42, red, [0, 0, 0.2]),
    box([0.4, 0.06, 2.0], white, [0, 0.28, 0.9]),
    ball(0.4, 10, glass(), [0, 0.36, -0.7], [1, 0.75, 1.5]),
    ...mirrored((x) => box([0.08, 0.9, 1.0], white, [x, 0.6, 1.4]), 0.95),
    ...mirrored((x) => tube(0.34, 0.3, 1.5, 10, dark, [x, -0.02, 1.9]), 0.62),
    ...mirrored((x) => engine(0.24, '#ffb15c', [x, -0.02, 2.7]), 0.62),
    ...mirrored((x) => tube(0.06, 0.07, 1.4, 6, dark, [x, -0.08, -0.4]), 1.2),
  );
}
