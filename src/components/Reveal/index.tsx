'use client';

// REACT
import { ReactNode } from 'react';
// FRAMER MOTION
import { m } from 'framer-motion';
// MOTION
import { spring } from '@/src/components/spring';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  // How much of the block must show before it enters.
  amount?: number;
}

// Fades content in and lifts it into place the first time it scrolls into
// view, on a spring like the iPhone's that goes a little past and settles.
// The fade ends with the lift, so a block at full opacity has stopped
// moving. With "reduce motion", MotionConfig keeps only the fade.
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  amount = 0.15,
}: Readonly<RevealProps>) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{
        opacity: { duration: 0.9, delay, ease: 'easeOut' },
        y: { duration: 0.9, delay, ease: spring },
      }}
    >
      {children}
    </m.div>
  );
}
