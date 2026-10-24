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
