'use client';

// HOOKS
import { useEffect } from 'react';

// Cards that a button covers shrink as a whole.
const pressable = [
  '.project-card',
  '.course-card',
  '.contrib-card',
  '.btn',
  '.theme-toggle',
  '.menu-toggle',
  '.social-links__link',
  '.site-nav__link',
  '.stack-menu__link',
  '.lang-switch__button',
  '.lang-switch__option',
  '.site-footer__top',
  '.projects__arrow',
  '.photo-viewer__arrow',
  '.edu-step',
  '.xp-card__toggle',
  '.snackbar__close',
].join(', ');

// How far the edges of what is pressed move in, at most. With a mouse, the
// release lands where the pointer is, so an edge that moved further could
// leave the pointer outside, and the click would be lost: a press on the
// arrow at the end of a wide title did nothing.
const travel = 2;

// Buttons, and the links that work as buttons, shrink a little under the
// finger and spring back when it lifts, as on the iPhone. A small button
// shrinks to 94%; a large one, like a wide title or a card, barely does,
// as on the iPhone too. The individual scale property adds to their
// transforms, such as a hover lift. With "reduce motion" nothing moves.
export default function Tactile() {
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    let pressed: { element: HTMLElement; animation: Animation } | null = null;

    const release = () => {
      if (!pressed) return;
      const { element, animation } = pressed;
      pressed = null;
      const scale = getComputedStyle(element).scale;
      animation.cancel();
      const spring = getComputedStyle(document.documentElement)
        .getPropertyValue('--ease-spring')
        .trim();
      element.animate(
        { scale: [scale, '1'] },
        { duration: 500, easing: spring || 'ease-out' },
      );
    };

    const press = (event: PointerEvent) => {
      if (!motion.matches || !event.isPrimary || event.button !== 0) return;
      const target = event.target as Element | null;
      const element = target?.closest<HTMLElement>(pressable);
      if (!element || element.matches(':disabled')) return;
      release();
      const { width, height } = element.getBoundingClientRect();
      const depth = Math.max(0.94, 1 - (2 * travel) / Math.max(width, height));
      pressed = {
        element,
        animation: element.animate(
          { scale: ['1', String(depth)] },
          { duration: 140, easing: 'ease-out', fill: 'forwards' },
        ),
      };
    };

    document.addEventListener('pointerdown', press, { passive: true });
    document.addEventListener('pointerup', release, { passive: true });
    // A swipe that scrolls cancels the press.
    document.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('blur', release);
    return () => {
      document.removeEventListener('pointerdown', press);
      document.removeEventListener('pointerup', release);
      document.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
    };
  }, []);

  return null;
}
