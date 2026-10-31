// HOOKS
import { useEffect, useEffectEvent, type RefObject } from 'react';

const focusable =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// A dialog over the flight: focus moves into it, Tab and Shift+Tab stay
// inside it, Escape closes it, and focus goes back where it was when it
// closes.
export function useDialog(
  dialog: RefObject<HTMLElement | null>,
  onClose: () => void,
  first?: RefObject<HTMLElement | null>,
) {
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const before = document.activeElement;
    (first?.current ?? element).focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = [
        ...element.querySelectorAll<HTMLElement>(focusable),
      ].filter((item) => item.getClientRects().length > 0);
      if (!items.length) return;
      const start = items[0];
      const end = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === start || active === element)) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && active === end) {
        event.preventDefault();
        start.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (before instanceof HTMLElement && before.isConnected) before.focus();
    };
  }, [dialog, first]);
}
