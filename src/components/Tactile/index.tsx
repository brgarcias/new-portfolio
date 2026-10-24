'use client';

// HOOKS
import { useEffect } from 'react';

// Cards that a button covers shrink as a whole, and less than a button.
const cards = '.project-card, .course-card, .contrib-card';
const pressable = [
  cards,
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

// Buttons, and the links that work as buttons, shrink a little under the
// finger and spring back when it lifts, as on the iPhone. The individual
// scale property adds to their transforms, such as a hover lift. With
// "reduce motion" nothing moves.
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
      const depth = element.matches(cards) ? 0.98 : 0.94;
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
