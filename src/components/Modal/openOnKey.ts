import type { KeyboardEvent } from 'react';

// Opens a dialog on Enter or Space themselves. The click the browser makes
// from those keys looks virtual to react-aria, which then waits for every
// transition on the page to end before moving the focus into the dialog.
// It lives apart from the dialog, so the buttons can use it without
// loading the dialog code.
export function openOnKey(open: () => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!event.repeat) open();
  };
}
