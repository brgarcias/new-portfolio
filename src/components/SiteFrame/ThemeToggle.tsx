'use client';

// HOOKS
import { MouseEvent, useEffect } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// THEME
import {
  applyTheme,
  currentTheme,
  hasStoredTheme,
  storeTheme,
  systemTheme,
  type Theme,
} from '@/src/app/theme';

// Switches still running, so quick clicks keep transitions off until the
// last one ends.
let switching = 0;
// The theme of the latest switch. The page takes it a frame later, under the
// circle, so a quick second click counts from it.
let latest: Theme | undefined;

// Ends the fade of the colors, after the last of quick clicks.
let fadeTimer = 0;

// With the menu open, the page sits back in 3D, which the snapshot of a view
// transition does not keep in every browser. There, the colors fade instead
// (.theme-fading, in globals.css).
function fadeTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-fading');
  applyTheme(theme);
  window.clearTimeout(fadeTimer);
  fadeTimer = window.setTimeout(
    () => root.classList.remove('theme-fading'),
    500,
  );
}

// Changes the theme with CSS transitions off, so nothing fades on its own:
// the page changes at once, or under a circle that spreads from the button.
function switchTheme(theme: Theme, origin?: HTMLElement) {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menuOpen = document.querySelector('.stage--locked') !== null;
  const animated =
    origin && !reduced && typeof document.startViewTransition === 'function';

  latest = theme;
  if (animated && menuOpen) {
    fadeTheme(theme);
    return;
  }
  switching += 1;
  const done = () => {
    switching -= 1;
    if (!switching) root.classList.remove('theme-switching');
  };
  const update = () => {
    root.classList.add('theme-switching');
    applyTheme(theme);
  };

  if (!animated) {
    update();
    // Reading a style applies the new colors while transitions are off.
    getComputedStyle(root).getPropertyValue('color');
    done();
    return;
  }

  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  const transition = document.startViewTransition(update);
  transition.ready
    .then(() =>
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      ),
    )
    // A newer switch skips this one, which then has nothing to animate.
    .catch(() => undefined);
  transition.finished.then(done, done);
}

export default function ThemeToggle() {
  const t = useI18n().messages.frame;

  // The browser bar takes the theme's color, and the page follows the
  // system while the visitor has not chosen a theme.
  useEffect(() => {
    applyTheme(currentTheme());
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (!hasStoredTheme()) switchTheme(systemTheme());
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    const theme = (latest ?? currentTheme()) === 'dark' ? 'light' : 'dark';
    storeTheme(theme);
    switchTheme(theme, event.currentTarget);
  };

  // The server does not know the visitor's theme, so both icons and both
  // labels are in the page, and CSS shows the ones for the current theme.
  return (
    <button type="button" className="theme-toggle" onClick={onClick}>
      <FontAwesomeIcon
        className="theme-toggle__icon theme-toggle__icon--sun"
        icon={faSun}
      />
      <FontAwesomeIcon
        className="theme-toggle__icon theme-toggle__icon--moon"
        icon={faMoon}
      />
      <span className="visually-hidden theme-toggle__label--to-light">
        {t.toLightTheme}
      </span>
      <span className="visually-hidden theme-toggle__label--to-dark">
        {t.toDarkTheme}
      </span>
    </button>
  );
}
