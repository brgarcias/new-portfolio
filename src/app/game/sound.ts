// The game's sounds, made on the spot with the Web Audio API, so no file
// is downloaded and the site's policy stays as it is: the engines, each ship
// with its own voice (engines.ts), which follow the thrust, the speed and the
// boost, the wind, and short notes for a landing, a holocron found, a bump, the
// arrival out of hyperspace and a photo. Off until the visitor turns them on,
// with a button that the browser counts as the gesture an AudioContext needs;
// the choice is kept in localStorage. Engines only run while they are heard: in
// flight and for a moment in the hangar, when a ship is chosen. A hidden page
// makes no sound.

// GAME
import {
  createEngine,
  makeNoiseBank,
  voices,
  type Engine,
  type NoiseBank,
} from './engines';
import type { ShipId } from './ships';

const storageKey = 'sound';
// How often the engines follow the controls, in seconds. They glide anyway, and
// every change is an event on each of their dozens of parameters.
const humStep = 1 / 15;
// How long a ship's engines hold in the hangar, once up, and how long they take
// to settle back and go.
const previewHold = 1.4;
const previewEnd = 0.7;
// How long the engines take to fade out and go, in milliseconds, when the sound is
// turned off.
const fadeOut = 1000;

export const sound = {
  enabled: false,
  context: null as AudioContext | null,
  master: null as GainNode | null,
  // Under the master, what the engines and the wind go through.
  bed: null as GainNode | null,
  noise: null as NoiseBank | null,
  wind: null as GainNode | null,
  // The engines running, one ship's at a time.
  engine: null as Engine | null,
  ship: null as ShipId | null,
  // Until when they spool up, with the hum waiting.
  spooling: 0,
  // When they last followed the controls, and whether under boost.
  hummed: 0,
  boosting: false,
  previewTimer: 0,
  lastBump: 0,
};

export function storedSound() {
  try {
    return localStorage.getItem(storageKey) === 'on';
  } catch {
    return false;
  }
}

// On an iPhone, a page's sound counts as ambient, and silent mode mutes it on the
// speaker, though not on headphones or a Bluetooth speaker: the button would seem
// broken. The visitor asked for the sound by pressing it, so it plays as media
// does. Only Safari has this so far, and nothing else needs it.
function playAsMedia(on: boolean) {
  const { audioSession } = navigator as Navigator & {
    audioSession?: { type: string };
  };
  if (audioSession) audioSession.type = on ? 'playback' : 'auto';
}

function setUp() {
  if (sound.context) return;
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0;
  // The voices are quiet for a phone's speaker, so everything goes up, and this
  // keeps the engines and the notes together from clipping. It also lifts what
  // stays under its threshold, by itself, about 7 dB in Chromium and WebKit alike.
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -18;
  limiter.knee.value = 12;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.005;
  limiter.release.value = 0.15;
  master.connect(limiter);
  limiter.connect(context.destination);
  const bed = context.createGain();
  bed.connect(master);
  const noise = makeNoiseBank(context);

  const wind = context.createGain();
  wind.gain.value = 0;
  const rush = context.createBufferSource();
  rush.buffer = noise.white;
  rush.loop = true;
  const band = context.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 900;
  band.Q.value = 0.6;
  rush.connect(band);
  band.connect(wind);
  wind.connect(bed);
  rush.start();

  sound.context = context;
  sound.master = master;
  sound.bed = bed;
  sound.noise = noise;
  sound.wind = wind;

  // A hidden page makes no sound: the context sleeps until the page shows
  // again, and wakes only if the sound is still on.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void context.suspend();
    else if (sound.enabled) void context.resume();
  });
}

export function setSound(on: boolean) {
  sound.enabled = on;
  try {
    localStorage.setItem(storageKey, on ? 'on' : 'off');
  } catch {}
  if (on) {
    playAsMedia(true);
    setUp();
    const { context, master } = sound;
    if (!context || !master) return;
    void context.resume();
    master.gain.setTargetAtTime(1, context.currentTime, 0.05);
  } else if (sound.context && sound.master) {
    const { context, master } = sound;
    master.gain.setTargetAtTime(0, context.currentTime, 0.05);
    quiet();
    // Off, it lets go of the phone's audio, for the music of another app, and
    // sleeps once the engines have gone.
    playAsMedia(false);
    window.setTimeout(() => {
      if (!sound.enabled) void context.suspend();
    }, fadeOut);
  }
}

// The engines of a ship, running: the ones already on, or new ones, in place of
// another ship's.
function running(id: ShipId) {
  const { enabled, context, bed, noise } = sound;
  if (!enabled || !context || !bed || !noise) return null;
  if (sound.engine && sound.ship === id) return sound.engine;
  sound.engine?.stop(context.currentTime);
  sound.ship = id;
  sound.engine = createEngine(context, bed, voices[id], noise);
  return sound.engine;
}

// The engines and the wind stay down while the visitor reads, but the notes of
// what is pressed don't.
export function duck(on: boolean) {
  const { context, bed } = sound;
  if (!context || !bed) return;
  bed.gain.setTargetAtTime(on ? 0.35 : 1, context.currentTime, 0.25);
}

// The engines stop and go, and the wind dies down, as the ship leaves the flight
// for the hangar or the photo mode.
export function quiet() {
  window.clearTimeout(sound.previewTimer);
  const { context, engine, wind } = sound;
  if (!context) return;
  const now = context.currentTime;
  engine?.stop(now);
  sound.engine = null;
  sound.ship = null;
  sound.spooling = 0;
  sound.boosting = false;
  wind?.gain.setTargetAtTime(0, now, 0.12);
}

// On take-off, the ship's engines spool up, and the hum takes over once they have.
export function ignite(id: ShipId) {
  const engine = running(id);
  if (!engine || !sound.context) return;
  window.clearTimeout(sound.previewTimer);
  const now = sound.context.currentTime;
  engine.rev(now);
  engine.kick(now + 0.2);
  sound.spooling = now + engine.voice.spool;
}

// In the hangar, a ship's engines for a moment, to hear it before choosing.
export function preview(id: ShipId) {
  const engine = running(id);
  if (!engine || !sound.context) return;
  window.clearTimeout(sound.previewTimer);
  engine.rev(sound.context.currentTime, previewHold);
  sound.previewTimer = window.setTimeout(
    quiet,
    (engine.voice.spool + previewHold + previewEnd) * 1000,
  );
}

// Each frame: how hard the engines work, under boost or not, and how much of its
// top speed the ship is at, from 0 to 1, for them and for the wind.
export function hum(id: ShipId, thrust: number, boost: boolean, pace: number) {
  const { enabled, context, wind } = sound;
  if (!enabled || !context || !wind) return;
  const now = context.currentTime;
  if (now < sound.spooling) return;
  if (boost === sound.boosting && now - sound.hummed < humStep) return;
  const engine = running(id);
  if (!engine) return;
  // A ship in flight is past any moment in the hangar.
  window.clearTimeout(sound.previewTimer);
  const share = Math.min(1, pace);
  engine.set(0.62 * Math.max(0, thrust) + 0.38 * share, boost, now);
  if (boost && !sound.boosting) engine.kick(now);
  sound.hummed = now;
  sound.boosting = boost;
  wind.gain.setTargetAtTime(share * 0.09 + (boost ? 0.05 : 0), now, 0.1);
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
  | 'arrive'
  | 'photo'
  | 'party'
  | 'blip'
  | 'plot'
  | 'route'
  | 'recalculate';

// Each gate of a flight plan sounds the next note of this scale, so that
// flying the whole corridor plays a phrase that climbs to the landing.
const gateScale = [
  440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98,
];

export function playGate(flown: number) {
  if (!sound.enabled) return;
  const note = gateScale[Math.min(gateScale.length - 1, flown - 1)];
  tone([note, note * 1.5], [0, 0.03], 'triangle', 0.26, 0.075);
}

export function play(cue: Cue) {
  const { enabled, context, master, noise } = sound;
  if (!enabled || !context || !master || !noise) return;
  const now = context.currentTime;
  switch (cue) {
    case 'blip':
      // A soft tick for the chart and the course.
      tone([988, 1319], [0, 0.05], 'sine', 0.16, 0.07);
      break;
    case 'plot': {
      // The nav computer working out the way: an astromech's quick chatter.
      const osc = context.createOscillator();
      osc.type = 'sine';
      const notes = [1480, 2217, 1320, 2637, 1760, 2960, 2093];
      notes.forEach((note, index) => {
        const at = now + index * 0.058;
        osc.frequency.setValueAtTime(note, at);
        osc.frequency.exponentialRampToValueAtTime(
          note * (index % 2 ? 0.78 : 1.22),
          at + 0.05,
        );
      });
      const gain = context.createGain();
      const end = now + notes.length * 0.058;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.012);
      gain.gain.setValueAtTime(0.05, end - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, end + 0.03);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(end + 0.05);
      break;
    }
    case 'route':
      // The route opening out over the world.
      tone([392, 587, 784], [0, 0.09, 0.18], 'sine', 0.55, 0.06);
      break;
    case 'recalculate':
      tone([740, 554], [0, 0.09], 'square', 0.09, 0.022);
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
    case 'arrive': {
      // Out of hyperspace: a rush of air that falls away, over a low boom.
      const rush = context.createBufferSource();
      rush.buffer = noise.white;
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
      click.buffer = noise.white;
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
