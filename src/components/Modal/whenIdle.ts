// Runs a callback once the browser is idle after the page loads, or after a
// moment where requestIdleCallback is missing, as in older Safari. Returns
// the function that cancels it.
export function whenIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(callback, { timeout: 4000 });
    return () => window.cancelIdleCallback(handle);
  }
  const timer = setTimeout(callback, 1500);
  return () => clearTimeout(timer);
}

// Downloads a part of the page once the browser is idle, ahead of its use. If
// that fails, as when the visitor leaves in the middle of it or the connection
// drops, nothing is wrong yet: the download is tried again when the part is
// needed.
export function preloadWhenIdle(load: () => Promise<unknown>) {
  return whenIdle(() => {
    load().catch(() => undefined);
  });
}
