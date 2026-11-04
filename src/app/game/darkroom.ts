// What a photo is developed with: its filter, its exposure, its vignette, its
// frame and its caption. The viewfinder shows the filter with a CSS filter on
// the canvas, and develop() applies the same steps to the picture's pixels, with
// the same formulas: a canvas's own `filter` does not exist in Safari, and a CSS
// filter does not reach what is read from the canvas.

type Step =
  | ['brightness' | 'contrast' | 'saturate' | 'sepia' | 'grayscale', number]
  | ['hue-rotate', number];

export const filters = {
  none: [],
  vivid: [
    ['saturate', 1.45],
    ['contrast', 1.08],
  ],
  noir: [
    ['grayscale', 1],
    ['contrast', 1.3],
    ['brightness', 1.02],
  ],
  archive: [
    ['sepia', 0.75],
    ['contrast', 1.08],
    ['brightness', 1.02],
  ],
  holonet: [
    ['grayscale', 1],
    ['sepia', 1],
    ['hue-rotate', 165],
    ['saturate', 2.2],
    ['contrast', 1.1],
  ],
  sunset: [
    ['sepia', 0.3],
    ['saturate', 1.35],
    ['hue-rotate', -10],
    ['brightness', 1.04],
  ],
} as const satisfies Record<string, readonly Step[]>;

export type FilterId = keyof typeof filters;
export const filterIds = Object.keys(filters) as FilterId[];

// Width over height; the screen's own shape, without a crop, has none.
export const frames = {
  screen: null,
  wide: 16 / 9,
  cinema: 2.39,
  square: 1,
  portrait: 4 / 5,
} as const;

export type FrameId = keyof typeof frames;
export const frameIds = Object.keys(frames) as FrameId[];

export interface Caption {
  title: string;
  line: string;
  // The font of the interface, as the browser names it.
  family: string;
}

export interface Look {
  filter: FilterId;
  // In stops: each one doubles the light.
  exposure: number;
  vignette: boolean;
  frame: FrameId;
  caption: Caption | null;
}

const stepsOf = (filter: FilterId, exposure: number): readonly Step[] =>
  exposure === 0
    ? filters[filter]
    : [['brightness', 2 ** exposure], ...filters[filter]];

export function cssFilter(filter: FilterId, exposure: number) {
  const steps = stepsOf(filter, exposure);
  if (!steps.length) return 'none';
  return steps
    .map(([name, value]) =>
      name === 'hue-rotate' ? `${name}(${value}deg)` : `${name}(${value})`,
    )
    .join(' ');
}

// Red, green and blue as sums of red, green, blue and a constant, as the CSS
// filters define them.
type Matrix = number[];
const identity: Matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

function matrixOf([name, value]: Step): Matrix {
  const v = value;
  const i = 1 - v;
  const cos = Math.cos((v * Math.PI) / 180);
  const sin = Math.sin((v * Math.PI) / 180);
  switch (name) {
    case 'brightness':
      return [v, 0, 0, 0, 0, v, 0, 0, 0, 0, v, 0];
    case 'contrast': {
      const shift = 0.5 - 0.5 * v;
      return [v, 0, 0, shift, 0, v, 0, shift, 0, 0, v, shift];
    }
    case 'saturate':
      return [
        0.213 + 0.787 * v,
        0.715 - 0.715 * v,
        0.072 - 0.072 * v,
        0,
        0.213 - 0.213 * v,
        0.715 + 0.285 * v,
        0.072 - 0.072 * v,
        0,
        0.213 - 0.213 * v,
        0.715 - 0.715 * v,
        0.072 + 0.928 * v,
        0,
      ];
    case 'sepia':
      return [
        0.393 + 0.607 * i,
        0.769 - 0.769 * i,
        0.189 - 0.189 * i,
        0,
        0.349 - 0.349 * i,
        0.686 + 0.314 * i,
        0.168 - 0.168 * i,
        0,
        0.272 - 0.272 * i,
        0.534 - 0.534 * i,
        0.131 + 0.869 * i,
        0,
      ];
    case 'grayscale':
      return [
        0.2126 + 0.7874 * i,
        0.7152 - 0.7152 * i,
        0.0722 - 0.0722 * i,
        0,
        0.2126 - 0.2126 * i,
        0.7152 + 0.2848 * i,
        0.0722 - 0.0722 * i,
        0,
        0.2126 - 0.2126 * i,
        0.7152 - 0.7152 * i,
        0.0722 + 0.9278 * i,
        0,
      ];
    case 'hue-rotate':
      return [
        0.213 + cos * 0.787 - sin * 0.213,
        0.715 - cos * 0.715 - sin * 0.715,
        0.072 - cos * 0.072 + sin * 0.928,
        0,
        0.213 - cos * 0.213 + sin * 0.143,
        0.715 + cos * 0.285 + sin * 0.14,
        0.072 - cos * 0.072 - sin * 0.283,
        0,
        0.213 - cos * 0.213 - sin * 0.787,
        0.715 - cos * 0.715 + sin * 0.715,
        0.072 + cos * 0.928 + sin * 0.072,
        0,
      ];
  }
}

// `after` applied to the result of `before`.
function compose(after: Matrix, before: Matrix): Matrix {
  const out: Matrix = [];
  for (let row = 0; row < 3; row += 1) {
    const r = row * 4;
    for (let column = 0; column < 4; column += 1) {
      out.push(
        after[r] * before[column] +
          after[r + 1] * before[4 + column] +
          after[r + 2] * before[8 + column] +
          (column === 3 ? after[r + 3] : 0),
      );
    }
  }
  return out;
}

function applySteps(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  steps: readonly Step[],
) {
  if (!steps.length) return;
  const m = steps.reduce<Matrix>(
    (matrix, step) => compose(matrixOf(step), matrix),
    identity,
  );
  const image = context.getImageData(0, 0, width, height);
  // A clamped array: what passes from 0 to 255 stops there.
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = m[0] * r + m[1] * g + m[2] * b + m[3] * 255;
    data[i + 1] = m[4] * r + m[5] * g + m[6] * b + m[7] * 255;
    data[i + 2] = m[8] * r + m[9] * g + m[10] * b + m[11] * 255;
  }
  context.putImageData(image, 0, 0);
}

function drawVignette(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  // An ellipse through the corners, as the viewfinder's CSS gradient.
  const radius = (width / 2) * Math.SQRT2;
  context.save();
  context.translate(width / 2, height / 2);
  context.scale(1, height / width);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  context.fillStyle = gradient;
  context.fillRect(-radius, -radius * 2, radius * 2, radius * 4);
  context.restore();
}

// Letter by letter: a canvas's letterSpacing is not in every browser.
function drawSpaced(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  let at = x;
  for (const letter of text) {
    context.fillText(letter, at, y);
    at += context.measureText(letter).width + spacing;
  }
}

function drawCaption(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  { title, line, family }: Caption,
) {
  // In shares of the shorter side, as the viewfinder's in `cqmin`.
  const unit = Math.min(width, height) / 100;
  const left = unit * 4;
  const bottom = height - unit * 4;
  context.save();
  context.fillStyle = '#fff';
  context.textBaseline = 'alphabetic';
  context.shadowColor = 'rgba(0, 0, 0, 0.6)';
  context.shadowBlur = unit * 1.2;
  context.shadowOffsetY = unit * 0.2;
  context.font = `500 ${unit * 1.9}px ${family}`;
  drawSpaced(context, line, left, bottom, unit * 0.114);
  context.font = `700 ${unit * 4.4}px ${family}`;
  drawSpaced(
    context,
    title.toUpperCase(),
    left,
    bottom - unit * 3.4,
    unit * 1.408,
  );
  context.restore();
}

// A picture from the canvas, as the viewfinder shows it: cut to its frame from
// the middle, with the filter, the vignette and the caption.
export function develop(source: HTMLCanvasElement, look: Look) {
  const ratio = frames[look.frame];
  let width = source.width;
  let height = source.height;
  if (ratio) {
    if (width / height > ratio) width = Math.round(height * ratio);
    else height = Math.round(width / ratio);
  }
  const picture = document.createElement('canvas');
  picture.width = width;
  picture.height = height;
  const context = picture.getContext('2d', { willReadFrequently: true });
  if (!context) return picture;
  context.drawImage(
    source,
    (source.width - width) / 2,
    (source.height - height) / 2,
    width,
    height,
    0,
    0,
    width,
    height,
  );
  applySteps(context, width, height, stepsOf(look.filter, look.exposure));
  if (look.vignette) drawVignette(context, width, height);
  if (look.caption) drawCaption(context, width, height, look.caption);
  return picture;
}
