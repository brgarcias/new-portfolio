// HOOKS
import { useMemo, useSyncExternalStore } from 'react';

const subscribeTo = (query: string) => (onChange: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

// Whether a media query matches, following it as it changes. On the server
// it does not.
export function useMediaQuery(query: string) {
  const subscribe = useMemo(() => subscribeTo(query), [query]);
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// The game itself moves, since the visitor started it, but with this the
// bobbing, the turning of the ship in the hangar and the camera's lag stay
// still.
export const useReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');
