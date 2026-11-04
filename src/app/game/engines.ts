// GAME
import type { ShipId } from './ships';

// The voice of each ship's engines, made on the spot with the Web Audio API.
//
// A motorcycle is a train of pulses whose rate climbs with the throttle: a low
// wave with hard edges, a series of harmonics locked to it, and a pitch that
// sweeps up as it revs. A voice here does none of that, and a test checks it:
// nothing with hard edges goes under 200 Hz, no two low tones are close enough to
// beat at the rate of an exhaust, and the pitch barely moves. What opens with the
// throttle is the roar of filtered noise around the tones.
//
// Nothing holds still, either: a steady tone is a synthesizer, and an engine is
// not. The pitch and the noise wander at random, and the tones flicker like a
// flame. `pitch`, `at` and `level` go from idle to full power.

type Range = readonly [idle: number, full: number];

type NoiseColor = 'white' | 'pink' | 'brown';

interface Tone {
  wave: OscillatorType;
  // Over the voice's pitch, or a pitch of its own, as a turbine climbs while the
  // rumble under it stays. In cents apart, so two tones beat slowly.
  ratio?: number;
  at?: Range;
  detune?: number;
  level: number;
  // From -1, on the left, to 1.
  pan?: number;
}

interface Hiss {
  color: NoiseColor;
  filter: 'bandpass' | 'lowpass' | 'highpass';
  at: Range;
  q: number;
  level: Range;
  // Two of it, one to each side, for the width of a ship.
  spread?: number;
}

interface Formant {
  at: Range;
  q: number;
  level: number;
}

export interface Voice {
  // The pitch of the tones, in Hz, and how much the boost raises it.
  pitch: Range;
  boost: number;
  tones: readonly Tone[];
  // What the tones go through: a filter that opens, or the resonances that give
  // a throat to a scream.
  body: { at: Range; q: number } | { formants: readonly Formant[] };
  // How much the tones are saturated before the body, for a rough edge.
  grit?: number;
  // A regular wobble of the pitch, for the ones that sing.
  vibrato?: { rate: number; cents: number };
  // The slow, random walk of the pitch and of the noise, how fast (over the eight
  // values a second of the slow noise) and how far.
  wander: { speed: number; cents: number };
  // The quick, random flicker of the tones.
  flutter?: { rate: number; depth: number };
  // A slow swell of the whole voice.
  throb?: { rate: number; depth: number };
  hisses: readonly Hiss[];
  // The loudness, set against the other voices by A-weighted measures.
  gain: { idle: number; full: number; boost: number };
  // How slowly it follows the throttle, in seconds: the weight of the ship.
  lag: number;
  // How long it takes to spool up, from rest.
  spool: number;
  // The rush of air when the boost kicks in, sweeping between two frequencies.
  kick: { from: number; to: number; q: number; level: number; length: number };
}

export const voices: Record<ShipId, Voice> = {
  // A fighter going by: a wide, breathy roar, a warm growl under it and a clean
  // whine over it, jet more than engine.
  xwing: {
    pitch: [166, 214],
    boost: 1.09,
    tones: [
      { wave: 'triangle', ratio: 1, detune: -6, level: 0.26, pan: -0.3 },
      { wave: 'triangle', ratio: 1, detune: 7, level: 0.26, pan: 0.3 },
      { wave: 'sine', ratio: 2.37, level: 0.16 },
      { wave: 'sine', ratio: 3.91, detune: 3, level: 0.08 },
      { wave: 'sine', at: [1320, 1960], level: 0.035 },
    ],
    body: { at: [1100, 3400], q: 0.7 },
    wander: { speed: 0.05, cents: 14 },
    flutter: { rate: 9, depth: 0.14 },
    hisses: [
      {
        color: 'pink',
        filter: 'bandpass',
        at: [300, 900],
        q: 0.55,
        level: [0.9, 1.9],
        spread: 0.35,
      },
      {
        color: 'white',
        filter: 'bandpass',
        at: [2300, 4600],
        q: 0.8,
        level: [0.02, 0.1],
      },
    ],
    gain: { idle: 0.11, full: 0.25, boost: 0.32 },
    lag: 0.16,
    spool: 0.85,
    kick: { from: 600, to: 2600, q: 0.8, level: 0.8, length: 0.55 },
  },

  // The howl: two raw tones through the resonances of a throat, which bends,
  // shakes and rattles, over the hiss of tyres on a wet road. Twin ion engines,
  // one to each side. Raw and high, so it screams rather than revs.
  tie: {
    pitch: [290, 352],
    boost: 1.12,
    tones: [
      { wave: 'sawtooth', ratio: 1, detune: -11, level: 0.5, pan: -0.5 },
      { wave: 'sawtooth', ratio: 1, detune: 12, level: 0.5, pan: 0.5 },
      { wave: 'square', ratio: 2.003, detune: 4, level: 0.05 },
    ],
    body: {
      formants: [
        { at: [780, 1060], q: 4.5, level: 1 },
        { at: [1520, 2060], q: 6, level: 0.85 },
        { at: [2700, 3500], q: 7, level: 0.5 },
      ],
    },
    vibrato: { rate: 6.1, cents: 18 },
    wander: { speed: 0.2, cents: 40 },
    flutter: { rate: 18, depth: 0.22 },
    hisses: [
      {
        color: 'pink',
        filter: 'bandpass',
        at: [980, 1650],
        q: 1.4,
        level: [0.08, 0.3],
      },
      {
        color: 'white',
        filter: 'bandpass',
        at: [3400, 5600],
        q: 1.2,
        level: [0.03, 0.16],
        spread: 0.3,
      },
    ],
    gain: { idle: 0.07, full: 0.21, boost: 0.28 },
    lag: 0.1,
    spool: 0.7,
    kick: { from: 1400, to: 3600, q: 2.5, level: 0.8, length: 0.4 },
  },

  // A freighter's weight: a deep rumble you feel more than hear, two low tones
  // beating slowly, a throat far above them that small speakers can play, and a
  // turbine that climbs while the rumble stays where it is.
  falcon: {
    pitch: [48, 53],
    boost: 1.04,
    tones: [
      { wave: 'sine', ratio: 1, detune: -8, level: 0.44 },
      { wave: 'sine', ratio: 1, detune: 9, level: 0.44 },
      { wave: 'triangle', at: [148, 166], detune: -5, level: 0.2, pan: -0.3 },
      { wave: 'triangle', at: [148, 166], detune: 6, level: 0.2, pan: 0.3 },
      { wave: 'sine', at: [311, 372], level: 0.09 },
      { wave: 'sine', at: [520, 880], detune: 6, level: 0.1 },
    ],
    body: { at: [700, 1500], q: 0.8 },
    wander: { speed: 0.03, cents: 10 },
    flutter: { rate: 6, depth: 0.12 },
    throb: { rate: 3.1, depth: 0.08 },
    hisses: [
      {
        color: 'brown',
        filter: 'lowpass',
        at: [190, 480],
        q: 0.5,
        level: [1.5, 2.4],
      },
      {
        color: 'pink',
        filter: 'bandpass',
        at: [460, 980],
        q: 0.8,
        level: [0.16, 0.4],
        spread: 0.4,
      },
    ],
    gain: { idle: 0.13, full: 0.23, boost: 0.3 },
    lag: 0.34,
    spool: 1.05,
    kick: { from: 180, to: 760, q: 0.7, level: 0.9, length: 0.8 },
  },

  // Small and all engine: a thin whine, the highest of them, that climbs fast, on
  // the air of a jet.
  awing: {
    pitch: [700, 1040],
    boost: 1.1,
    tones: [
      { wave: 'sine', ratio: 1, level: 0.42 },
      { wave: 'sine', ratio: 1, detune: -14, level: 0.24, pan: -0.25 },
      { wave: 'triangle', ratio: 2.01, detune: 6, level: 0.12, pan: 0.25 },
      { wave: 'sine', ratio: 3.03, level: 0.04 },
    ],
    body: { at: [2600, 7000], q: 1.1 },
    wander: { speed: 0.12, cents: 16 },
    flutter: { rate: 13, depth: 0.1 },
    hisses: [
      {
        color: 'pink',
        filter: 'bandpass',
        at: [1500, 3200],
        q: 0.7,
        level: [0.32, 0.8],
        spread: 0.3,
      },
      {
        color: 'white',
        filter: 'bandpass',
        at: [5000, 9000],
        q: 0.9,
        level: [0.04, 0.18],
      },
    ],
    gain: { idle: 0.036, full: 0.11, boost: 0.15 },
    lag: 0.05,
    spool: 0.5,
    kick: { from: 1800, to: 6000, q: 1.2, level: 0.45, length: 0.3 },
  },

  // An old bomber: two tired engines out of step, with a slow beat between them,
  // rough and hollow, as through a long pipe, on a heavy drone of noise.
  ywing: {
    pitch: [126, 148],
    boost: 1.05,
    tones: [
      { wave: 'triangle', ratio: 1, detune: -9, level: 0.36, pan: -0.5 },
      { wave: 'triangle', ratio: 1, detune: 9, level: 0.36, pan: 0.5 },
      { wave: 'triangle', ratio: 3.8, detune: -7, level: 0.14, pan: -0.3 },
      { wave: 'sawtooth', ratio: 3.85, detune: 7, level: 0.05, pan: 0.3 },
    ],
    body: {
      formants: [
        { at: [390, 540], q: 2.5, level: 1 },
        { at: [930, 1280], q: 3.5, level: 0.8 },
      ],
    },
    grit: 2,
    wander: { speed: 0.06, cents: 18 },
    flutter: { rate: 7, depth: 0.3 },
    throb: { rate: 1.3, depth: 0.14 },
    hisses: [
      {
        color: 'brown',
        filter: 'lowpass',
        at: [150, 280],
        q: 0.5,
        level: [0.6, 1],
      },
      {
        color: 'pink',
        filter: 'bandpass',
        at: [300, 760],
        q: 0.8,
        level: [0.5, 1.1],
        spread: 0.5,
      },
      {
        color: 'white',
        filter: 'bandpass',
        at: [1500, 2600],
        q: 1.3,
        level: [0.02, 0.07],
      },
    ],
    gain: { idle: 0.13, full: 0.31, boost: 0.38 },
    lag: 0.24,
    spool: 0.95,
    kick: { from: 300, to: 1300, q: 0.9, level: 0.7, length: 0.65 },
  },

  // A royal fighter, polished: a clean, almost musical chord of pure tones on a
  // shimmer of air, which glides.
  n1: {
    pitch: [262, 349],
    boost: 1.12,
    tones: [
      { wave: 'sine', ratio: 1, level: 0.38 },
      { wave: 'sine', ratio: 1.5, detune: 3, level: 0.24, pan: 0.3 },
      { wave: 'sine', ratio: 2, detune: -3, level: 0.18, pan: -0.3 },
      { wave: 'triangle', ratio: 3, level: 0.05 },
      { wave: 'sine', ratio: 4.01, level: 0.03 },
    ],
    body: { at: [1800, 5600], q: 0.6 },
    vibrato: { rate: 4.6, cents: 5 },
    wander: { speed: 0.05, cents: 6 },
    flutter: { rate: 5, depth: 0.05 },
    hisses: [
      {
        color: 'pink',
        filter: 'bandpass',
        at: [760, 1500],
        q: 0.7,
        level: [0.22, 0.6],
        spread: 0.3,
      },
      {
        color: 'white',
        filter: 'highpass',
        at: [6200, 8800],
        q: 0.6,
        level: [0.01, 0.06],
      },
    ],
    gain: { idle: 0.075, full: 0.19, boost: 0.26 },
    lag: 0.12,
    spool: 0.75,
    kick: { from: 900, to: 3800, q: 1, level: 0.5, length: 0.45 },
  },
};

// Noise, in the three colors. A few seconds, so the loop is not heard.
function makeNoise(context: BaseAudioContext, color: NoiseColor) {
  const length = context.sampleRate * 4;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  // Paul Kellet's filter, for pink; a leaky sum, for brown.
  let [b0, b1, b2, b3, b4, b5, b6, last] = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (color === 'white') {
      data[i] = white;
    } else if (color === 'brown') {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    } else {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

// Smooth random values, eight a second, to move things by. A sine wave repeats
// itself, and the ear finds it out. They are slow, so a low rate will do.
function makeSlowNoise(context: BaseAudioContext) {
  const values = Array.from({ length: 64 }, () => Math.random() * 2 - 1);
  const rate = 8000;
  const length = rate * 8;
  const buffer = context.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const at = (i / length) * values.length;
    const index = Math.floor(at);
    const part = at - index;
    const smooth = part * part * (3 - 2 * part);
    data[i] =
      values[index] * (1 - smooth) +
      values[(index + 1) % values.length] * smooth;
  }
  return buffer;
}

export type NoiseBank = Record<NoiseColor | 'slow', AudioBuffer>;

export const makeNoiseBank = (context: BaseAudioContext): NoiseBank => ({
  white: makeNoise(context, 'white'),
  pink: makeNoise(context, 'pink'),
  brown: makeNoise(context, 'brown'),
  slow: makeSlowNoise(context),
});

const mix = ([idle, full]: Range, load: number) => idle + (full - idle) * load;

const pitchOf = (voice: Voice, tone: Tone, load: number, boost: boolean) =>
  (tone.at ? mix(tone.at, load) : mix(voice.pitch, load) * (tone.ratio ?? 1)) *
  (boost ? voice.boost : 1);

// A soft clip, which rounds the tops of a wave and adds the rough harmonics.
function softClip(context: BaseAudioContext, drive: number) {
  const shaper = context.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / Math.tanh(drive);
  }
  shaper.curve = curve;
  shaper.oversample = '2x';
  return shaper;
}

export interface Engine {
  voice: Voice;
  // How hard it works, from 0 to 1, with the boost, from a moment on.
  set: (load: number, boost: boolean, at: number, lag?: number) => void;
  // Spools up from where it is, holds for a while and settles back to idle.
  rev: (at: number, hold?: number) => void;
  // The rush of air of the boost.
  kick: (at: number) => void;
  // Fades out and frees everything.
  stop: (at: number) => void;
}

// Builds the voice, silent until it is set, with the tones well under their idle,
// so they climb to it. It takes any context, so the voices can also be rendered
// off line, to measure them.
export function createEngine(
  context: BaseAudioContext,
  destination: AudioNode,
  voice: Voice,
  noise: NoiseBank,
): Engine {
  const output = context.createGain();
  output.gain.value = 0;
  const swell = context.createGain();
  output.connect(swell);
  swell.connect(destination);

  const sources: AudioScheduledSourceNode[] = [];
  const amount = (from: AudioNode, depth: number) => {
    const node = context.createGain();
    node.gain.value = depth;
    from.connect(node);
    return node;
  };
  const route = (from: AudioNode, into: AudioNode, pan = 0) => {
    if (!pan) {
      from.connect(into);
      return;
    }
    const panner = context.createStereoPanner();
    panner.pan.value = pan;
    from.connect(panner);
    panner.connect(into);
  };
  const wave = (rate: number) => {
    const oscillator = context.createOscillator();
    oscillator.frequency.value = rate;
    oscillator.start();
    sources.push(oscillator);
    return oscillator;
  };
  // Anywhere in the buffer, so two voices don't start alike.
  const loop = (buffer: AudioBuffer, rate = 1) => {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = rate;
    source.start(0, Math.random() * buffer.duration);
    sources.push(source);
    return source;
  };

  // The tones, into the body. Where the body is one filter, they keep their
  // sides; through a throat, each resonance takes both.
  const bus = context.createGain();
  const body = context.createGain();
  if (voice.grit) {
    const shaper = softClip(context, voice.grit);
    bus.connect(shaper);
    shaper.connect(body);
  } else {
    bus.connect(body);
  }
  const filters: { node: BiquadFilterNode; at: Range }[] = [];
  const { body: shape } = voice;
  if ('formants' in shape) {
    for (const formant of shape.formants) {
      const node = context.createBiquadFilter();
      node.type = 'bandpass';
      node.Q.value = formant.q;
      node.frequency.value = formant.at[0];
      body.connect(node);
      // A narrow band lets little through: its Q gives it back.
      amount(node, formant.level * Math.sqrt(formant.q)).connect(output);
      filters.push({ node, at: formant.at });
    }
  } else {
    const node = context.createBiquadFilter();
    node.type = 'lowpass';
    node.Q.value = shape.q;
    node.frequency.value = shape.at[0];
    body.connect(node);
    node.connect(output);
    filters.push({ node, at: shape.at });
  }

  const wandering = loop(noise.slow, voice.wander.speed);
  const pitchWander = amount(wandering, voice.wander.cents);
  // The noise wanders further than the tones, for the air to keep moving.
  const bandWander = amount(wandering, voice.wander.cents * 8);
  const vibrato =
    voice.vibrato && amount(wave(voice.vibrato.rate), voice.vibrato.cents);
  if (voice.flutter) {
    // The bus is at 1, and the flicker goes around it.
    amount(
      loop(noise.slow, voice.flutter.rate / 8),
      voice.flutter.depth,
    ).connect(bus.gain);
  }
  if (voice.throb) {
    amount(wave(voice.throb.rate), voice.throb.depth).connect(swell.gain);
  }

  const tones = voice.tones.map((tone) => {
    const oscillator = context.createOscillator();
    oscillator.type = tone.wave;
    oscillator.frequency.value = pitchOf(voice, tone, 0, false) * 0.62;
    oscillator.detune.value = tone.detune ?? 0;
    route(amount(oscillator, tone.level), bus, tone.pan);
    pitchWander.connect(oscillator.detune);
    vibrato?.connect(oscillator.detune);
    oscillator.start();
    sources.push(oscillator);
    return { oscillator, tone };
  });

  // The noise around them. Two sides of one hiss are a little apart, so they
  // don't sound like one noise in the middle.
  const hisses = voice.hisses.flatMap((hiss) =>
    (hiss.spread ? [-1, 1] : [0]).map((side) => {
      const filter = context.createBiquadFilter();
      const apart = 1 + side * 0.05;
      filter.type = hiss.filter;
      filter.frequency.value = hiss.at[0] * apart;
      filter.Q.value = hiss.q;
      bandWander.connect(filter.detune);
      loop(noise[hiss.color]).connect(filter);
      const share = hiss.spread ? 0.75 : 1;
      const level = amount(filter, hiss.level[0] * share);
      route(level, output, side * (hiss.spread ?? 0));
      return { filter, level, hiss, apart, share };
    }),
  );

  const params = [
    output.gain,
    ...tones.map(({ oscillator }) => oscillator.frequency),
    ...filters.map(({ node }) => node.frequency),
    ...hisses.flatMap(({ filter, level }) => [filter.frequency, level.gain]),
  ];
  const cancel = (at: number) => {
    for (const param of params) param.cancelScheduledValues(at);
  };

  const set: Engine['set'] = (load, boost, at, lag = voice.lag) => {
    for (const { oscillator, tone } of tones) {
      oscillator.frequency.setTargetAtTime(
        pitchOf(voice, tone, load, boost),
        at,
        lag,
      );
    }
    for (const { node, at: range } of filters) {
      node.frequency.setTargetAtTime(
        mix(range, load) * (boost ? 1.12 : 1),
        at,
        lag,
      );
    }
    for (const { filter, level, hiss, apart, share } of hisses) {
      filter.frequency.setTargetAtTime(
        mix(hiss.at, load) * apart * (boost ? 1.15 : 1),
        at,
        lag,
      );
      level.gain.setTargetAtTime(
        mix(hiss.level, load) * share * (boost ? 1.2 : 1),
        at,
        lag,
      );
    }
    const { idle, full, boost: loudest } = voice.gain;
    output.gain.setTargetAtTime(
      boost ? loudest : idle + (full - idle) * load,
      at,
      lag,
    );
  };

  return {
    voice,
    set,
    rev(at, hold = 0) {
      cancel(at);
      set(0.85, false, at, voice.spool / 3);
      set(0, false, at + voice.spool + hold, voice.lag * 2);
    },
    kick(at) {
      const { from, to, q, level, length } = voice.kick;
      const band = context.createBiquadFilter();
      band.type = 'bandpass';
      band.Q.value = q;
      band.frequency.setValueAtTime(from, at);
      band.frequency.exponentialRampToValueAtTime(to, at + length);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(level, at + length * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, at + length);
      const rush = context.createBufferSource();
      rush.buffer = noise.white;
      rush.connect(band);
      band.connect(gain);
      gain.connect(destination);
      rush.start(at, Math.random() * 3);
      rush.stop(at + length + 0.02);
    },
    stop(at) {
      const fade = 0.12;
      cancel(at);
      output.gain.setTargetAtTime(0, at, fade);
      sources[0].addEventListener('ended', () => swell.disconnect());
      for (const source of sources) source.stop(at + fade * 6);
    },
  };
}
