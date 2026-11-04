'use client';

// HOOKS
import { useEffect, useRef } from 'react';

const gap = 8;
const margin = 8;

// The label of an icon button, from its data-tip and data-key, one at a time. It
// lives over everything, outside the dialogs and the rows of buttons: a label
// inside them was cut by the sheet of a dialog, gave it a scroll bar it did not
// need and went behind the next button. It goes below its button, or to the side
// of it with data-tip-side="right", and stays on the screen. Touch has no hover,
// and the buttons have their own names for screen readers, so this is for the
// mouse and the keyboard's focus only.
export default function Tooltip() {
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tip = label.current;
    if (!tip) return;
    let target: HTMLElement | null = null;
    let frame = 0;

    const hide = () => {
      target = null;
      cancelAnimationFrame(frame);
      delete tip.dataset.show;
    };

    const place = (element: HTMLElement) => {
      const { tip: name, key, tipSide } = element.dataset;
      const text = key ? `${name}  ·  ${key}` : (name ?? '');
      if (tip.textContent !== text) tip.textContent = text;
      const box = element.getBoundingClientRect();
      const width = tip.offsetWidth;
      const height = tip.offsetHeight;
      const { innerWidth, innerHeight } = window;
      let x = box.left + (box.width - width) / 2;
      let y = box.bottom + gap;
      if (tipSide === 'right') {
        x = box.right + gap;
        y = box.top + (box.height - height) / 2;
        if (x + width + margin > innerWidth) x = box.left - gap - width;
      } else if (y + height + margin > innerHeight) {
        y = box.top - gap - height;
      }
      x = Math.min(Math.max(margin, x), innerWidth - width - margin);
      y = Math.min(Math.max(margin, y), innerHeight - height - margin);
      tip.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    };

    // It follows its button while it shows, and goes with it, as when the
    // dialog it is in closes under the pointer.
    const follow = () => {
      if (!target) return;
      if (!target.isConnected || !target.getClientRects().length) {
        hide();
        return;
      }
      place(target);
      frame = requestAnimationFrame(follow);
    };

    const show = (element: HTMLElement) => {
      cancelAnimationFrame(frame);
      target = element;
      place(element);
      tip.dataset.show = '';
      frame = requestAnimationFrame(follow);
    };

    const owner = (node: EventTarget | null) =>
      node instanceof Element ? node.closest<HTMLElement>('[data-tip]') : null;

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const element = owner(event.target);
      if (element && element !== target) show(element);
    };
    const onOut = (event: PointerEvent) => {
      if (target && !target.contains(event.relatedTarget as Node | null)) {
        hide();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      const element = owner(event.target);
      if (element?.matches(':focus-visible')) show(element);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };

    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('pointerdown', hide);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', hide);
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointerdown', hide);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return <span ref={label} className="g-tip" aria-hidden="true" />;
}
