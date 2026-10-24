'use client';

// HOOKS
import { useEffect } from 'react';

// The animations that loop forever, as the floating technologies of the top
// and the technology ribbon, wait while their part of the page is off
// screen, so the page works less while it scrolls. Those parts carry
// data-loop, and globals.css pauses what is under data-offscreen.
export default function OffscreenPause() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.toggleAttribute('data-offscreen', !entry.isIntersecting);
      }
    });
    for (const element of document.querySelectorAll('[data-loop]')) {
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return null;
}
