// The game's sounds, made on the spot with the Web Audio API, so no file
// is downloaded and the site's policy stays as it is: the hum of the
// engines, which rises with the thrust, the speed and the boost, the wind,
// and short notes for a landing, a holocron found, a bump, the take-off,
// the arrival out of hyperspace and a photo. Off until the visitor turns them on, with a button that
// the browser counts as the gesture an AudioContext needs; the choice is
// kept in localStorage.

const storageKey = 'sound';

interface Engine {
  gain: GainNode;
  filter: BiquadFilterNode;
  hum: OscillatorNode;
  sub: OscillatorNode;
  wind: GainNode;
}

export const sound = {
  enabled: false,
  context: null as AudioContext | null,
  master: null as GainNode | null,
  engine: null as Engine | null,
  lastBump: 0,
};

export function storedSound() {
  try {
    return localStorage.getItem(storageKey) === 'on';
  } catch {
    return false;
  }
}

// A second of white noise, for the wind and the bumps.
function noise(context: AudioContext) {
  const buffer = context.createBuffer(
    1,
    context.sampleRate,
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function setUp() {
  if (sound.context) return;
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const gain = context.createGain();
  gain.gain.value = 0;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 300;
  const hum = context.createOscillator();
  hum.type = 'sawtooth';
  hum.frequency.value = 50;
  const sub = context.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 100;
  hum.connect(filter);
  sub.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  hum.start();
  sub.start();

  const wind = context.createGain();
  wind.gain.value = 0;
  const rush = context.createBufferSource();
  rush.buffer = noise(context);
  rush.loop = true;
  const band = context.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 900;
  band.Q.value = 0.6;
  rush.connect(band);
  band.connect(wind);
  wind.connect(master);
  rush.start();

  sound.context = context;
  sound.master = master;
  sound.engine = { gain, filter, hum, sub, wind };
}

export function setSound(on: boolean) {
  sound.enabled = on;
  try {
    localStorage.setItem(storageKey, on ? 'on' : 'off');
  } catch {}
  if (on) {
    setUp();
    const { context, master } = sound;
    if (!context || !master) return;
    void context.resume();
    master.gain.setTargetAtTime(0.5, context.currentTime, 0.05);
  } else if (sound.context && sound.master) {
    sound.master.gain.setTargetAtTime(0, sound.context.currentTime, 0.05);
  }
}

// Each frame: how hard the engines work, and how fast the wind blows.
export function hum(thrust: number, boost: boolean, speed: number) {
  const { enabled, context, engine } = sound;
  if (!enabled || !context || !engine) return;
  const now = context.currentTime;
  const push = Math.max(0, thrust);
  engine.gain.gain.setTargetAtTime(
    0.06 + push * 0.12 + (boost ? 0.1 : 0),
    now,
    0.08,
  );
  engine.filter.frequency.setTargetAtTime(
    260 + push * 900 + (boost ? 1200 : 0) + speed * 18,
    now,
    0.1,
  );
  engine.hum.frequency.setTargetAtTime(
    48 + speed * 1.1 + (boost ? 18 : 0),
    now,
    0.1,
  );
  engine.sub.frequency.setTargetAtTime(96 + speed * 2.2, now, 0.1);
  engine.wind.gain.setTargetAtTime(
    Math.min(0.22, speed / 140) + (boost ? 0.12 : 0),
    now,
    0.1,
  );
}

// A note, or a chord, that fades: frequencies, their start offsets, the
// wave, the length and the loudness.
function tone(
  frequencies: number[],
  offsets: number[],
  type: OscillatorType,
  length: number,
  volume: number,
) {
  const { context, master } = sound;
  if (!context || !master) return;
  const now = context.currentTime;
  frequencies.forEach((frequency, index) => {
    const at = now + (offsets[index] ?? 0);
    const osc = context.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, at + length);
    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + length + 0.05);
  });
}

export type Cue =
  | 'land'
  | 'holocron'
  | 'bump'
  | 'takeoff'
  | 'arrive'
  | 'photo'
  | 'party'
  | 'blip';

export function play(cue: Cue) {
  const { enabled, context, master } = sound;
  if (!enabled || !context || !master) return;
  const now = context.currentTime;
  switch (cue) {
    case 'blip':
      // A soft tick for the chart and the course.
      tone([988, 1319], [0, 0.05], 'sine', 0.16, 0.07);
      break;
    case 'land':
      tone([523, 784], [0, 0.1], 'sine', 0.5, 0.18);
      break;
    case 'holocron':
      tone([660, 880, 1320], [0, 0.09, 0.18], 'triangle', 0.35, 0.16);
      break;
    case 'party':
      tone(
        [523, 659, 784, 1047, 1319],
        [0, 0.12, 0.24, 0.36, 0.48],
        'triangle',
        0.9,
        0.14,
      );
      break;
    case 'takeoff': {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.7);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + 1);
      break;
    }
    case 'arrive': {
      // Out of hyperspace: a rush of air that falls away, over a low boom.
      const rush = context.createBufferSource();
      rush.buffer = noise(context);
      const band = context.createBiquadFilter();
      band.type = 'bandpass';
      band.Q.value = 0.8;
      band.frequency.setValueAtTime(2600, now);
      band.frequency.exponentialRampToValueAtTime(260, now + 0.9);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
      rush.connect(band);
      band.connect(gain);
      gain.connect(master);
      rush.start(now);
      rush.stop(now + 1);
      const boom = context.createOscillator();
      boom.type = 'sine';
      boom.frequency.setValueAtTime(70, now);
      boom.frequency.exponentialRampToValueAtTime(36, now + 0.6);
      const low = context.createGain();
      low.gain.setValueAtTime(0.25, now);
      low.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      boom.connect(low);
      low.connect(master);
      boom.start(now);
      boom.stop(now + 0.75);
      break;
    }
    case 'bump': {
      // Not twice within a moment.
      if (now - sound.lastBump < 0.25) return;
      sound.lastBump = now;
      const thud = context.createOscillator();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(90, now);
      thud.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      thud.connect(gain);
      gain.connect(master);
      thud.start(now);
      thud.stop(now + 0.3);
      break;
    }
    case 'photo': {
      const click = context.createBufferSource();
      click.buffer = noise(context);
      const band = context.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 2800;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      click.connect(band);
      band.connect(gain);
      gain.connect(master);
      click.start(now);
      click.stop(now + 0.08);
      break;
    }
  }
}
