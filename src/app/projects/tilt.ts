// HOOKS
import type { PointerEvent } from 'react';

// What leans towards the mouse, with a light following it. Touch and pen leave
// it still, and "reduce motion" turns the effect off in CSS.
export function tilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse') return;
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  card.style.setProperty('--tilt-x', `${(-y * 10).toFixed(2)}deg`);
  card.style.setProperty('--tilt-y', `${(x * 14).toFixed(2)}deg`);
  card.style.setProperty('--glare-x', `${((x + 0.5) * 100).toFixed(1)}%`);
  card.style.setProperty('--glare-y', `${((y + 0.5) * 100).toFixed(1)}%`);
}

export function untilt(event: PointerEvent<HTMLElement>) {
  for (const name of ['--tilt-x', '--tilt-y', '--glare-x', '--glare-y']) {
    event.currentTarget.style.removeProperty(name);
  }
}
