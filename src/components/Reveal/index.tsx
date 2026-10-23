'use client';

// REACT
import { ReactNode } from 'react';
// FRAMER MOTION
import { m } from 'framer-motion';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

// Fades content in and lifts it into place the first time it scrolls into
// view. With "reduce motion", MotionConfig keeps only the fade.
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: Readonly<RevealProps>) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
