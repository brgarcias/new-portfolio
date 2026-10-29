import type { Controls } from './physics';

// The controls of the one ship in flight. The keyboard writes `keys`, the
// touch joystick writes `stick`, and the ship adds them up each frame. A
// module object, not React state: it changes many times a second.
export const input = {
  keys: { thrust: 0, turn: 0, boost: false } as Controls,
  stick: { thrust: 0, turn: 0, boost: false } as Controls,
};

export function readInput(): Controls {
  const { keys, stick } = input;
  return {
    thrust: keys.thrust + stick.thrust,
    turn: keys.turn + stick.turn,
    boost: keys.boost || stick.boost,
  };
}

export function resetInput() {
  Object.assign(input.keys, { thrust: 0, turn: 0, boost: false });
  Object.assign(input.stick, { thrust: 0, turn: 0, boost: false });
}

const held = {
  forward: false,
  back: false,
  left: false,
  right: false,
  boost: false,
};

const bindings: Record<string, keyof typeof held> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
  Space: 'boost',
};

// W, A, S, D or the arrows fly the ship; Shift or Space boosts. The keys
// are taken from the page while the game is on, so the arrows do not scroll
// it. Returns the function that gives them back.
export function listenToKeyboard() {
  const update = () => {
    input.keys.thrust = Number(held.forward) - Number(held.back);
    input.keys.turn = Number(held.right) - Number(held.left);
    input.keys.boost = held.boost;
  };
  const onKey = (event: KeyboardEvent) => {
    const action = bindings[event.code];
    if (!action) return;
    // Typing in a field is not flying.
    const target = event.target;
    if (
      target instanceof Element &&
      target.matches('input, textarea, select, [contenteditable]')
    ) {
      return;
    }
    event.preventDefault();
    if (event.repeat) return;
    held[action] = event.type === 'keydown';
    update();
  };
  const release = () => {
    for (const action of Object.keys(held) as (keyof typeof held)[]) {
      held[action] = false;
    }
    update();
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  window.addEventListener('blur', release);
  return () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
    window.removeEventListener('blur', release);
    resetInput();
  };
}
