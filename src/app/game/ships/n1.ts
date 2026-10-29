import {
  assemble,
  ball,
  box,
  chrome,
  engine,
  glass,
  mirrored,
  nose,
  paint,
  post,
  tube,
} from './parts';

const yellow = paint('#f4c53a');

export function buildN1() {
  return assemble(
    tube(0.1, 0.62, 5.0, 10, yellow, [0, 0, 0.3]),
    tube(0.1, 0.34, 1.4, 10, chrome, [0, 0, -1.55]),
    ball(0.4, 10, glass(), [0, 0.42, -0.2], [1, 0.6, 1.6]),
    ...mirrored((x) => tube(0.2, 0.32, 4.8, 10, yellow, [x, -0.1, 0.7]), 1.3),
    ...mirrored((x) => nose(0.2, 1.0, 10, chrome, [x, -0.1, -2.6]), 1.3),
    ...mirrored((x) => box([1.35, 0.14, 1.7], yellow, [x, -0.15, 0.9]), 0.68),
    ...mirrored((x) => engine(0.26, '#7fe6ff', [x, -0.1, 3.17]), 1.3),
    // The long finial that trails behind.
    post(0.05, 0.14, 2.8, 8, chrome, [0, 0.12, 4.0], [Math.PI / 2, 0, 0]),
  );
}
