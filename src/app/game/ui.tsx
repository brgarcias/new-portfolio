// Small pieces the game's interface repeats: a row of pips that counts,
// a keycap, a holocron drawn as a cube and a ship's line drawing.

// HOOKS
import type { CSSProperties, ReactNode } from 'react';
// GAME
import type { Ship } from './ships';

export function Pips({
  count,
  total,
  kind = 'bar',
  fresh,
  className,
}: {
  count: number;
  total: number;
  kind?: 'bar' | 'diamond';
  // The pip just lit, which pops.
  fresh?: number;
  className?: string;
}) {
  return (
    <span
      className={`pips pips--${kind}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={[
            'pips__pip',
            index < count ? 'is-on' : '',
            index === fresh ? 'is-fresh' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ '--i': index } as CSSProperties}
        />
      ))}
    </span>
  );
}

export function Keycap({ children }: { children: ReactNode }) {
  return <kbd className="g-kbd">{children}</kbd>;
}

// A holocron: a cube seen from a corner, with its glowing core.
export function HolocronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`holocron-icon${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="holocron-icon__top"
        d="M12 2.6L20.4 7.3L12 12L3.6 7.3Z"
      />
      <path className="holocron-icon__left" d="M3.6 7.3L12 12V21.4L3.6 16.7Z" />
      <path
        className="holocron-icon__right"
        d="M20.4 7.3L12 12V21.4L20.4 16.7Z"
      />
      <path
        className="holocron-icon__core"
        d="M12 9.3L14.5 10.7V13.5L12 14.9L9.5 13.5V10.7Z"
      />
    </svg>
  );
}

export function ShipGlyph({
  ship,
  className,
}: {
  ship: Ship;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ship.silhouette} />
    </svg>
  );
}
