// HOOKS
import { useSyncExternalStore } from 'react';
// THEME
import { currentTheme, type Theme } from '@/src/app/theme';

// The site's theme, the class on <html>, for what CSS cannot reach: the colors
// of the 3D scenes.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}

const serverTheme = (): Theme => 'dark';

export const useTheme = () =>
  useSyncExternalStore(subscribe, currentTheme, serverTheme);
