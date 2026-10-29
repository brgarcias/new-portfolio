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

const tan = paint('#d3cdb4');
const grey = paint('#8c9199');
const blue = paint('#3f7fd9');

export function buildYWing() {
  return assemble(
    box([0.95, 0.75, 2.3], tan, [0, 0, -2.2]),
    nose(0.45, 1.0, 8, tan, [0, 0, -3.85]),
    box([0.52, 0.36, 1.0], glass(), [0, 0.52, -2.3]),
    box([0.55, 0.45, 1.6], grey, [0, 0, -0.5]),
    ball(0.27, 8, blue, [0, 0.5, -0.95]),
    box([3.7, 0.36, 0.72], grey, [0, 0, 0.35]),
    ...mirrored((x) => tube(0.5, 0.5, 4.4, 10, tan, [x, 0, 1.1]), 1.6),
    ...mirrored((x) => nose(0.5, 0.9, 10, grey, [x, 0, -1.55]), 1.6),
    ...mirrored((x) => box([0.08, 0.75, 0.8], tan, [x, 0.6, 2.7]), 1.6),
    ...mirrored((x) => engine(0.4, '#ffa64d', [x, 0, 3.35]), 1.6),
  );
}
