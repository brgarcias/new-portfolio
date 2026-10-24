// app/providers.tsx
'use client';

import { HeroUIProvider } from '@heroui/react';
import { LazyMotion, MotionConfig } from 'framer-motion';
import Tactile from '@/src/components/Tactile';

// Loads framer-motion's DOM animation features on demand, as HeroUI does.
const loadMotionFeatures = () =>
  import('framer-motion').then((module) => module.domAnimation);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <LazyMotion features={loadMotionFeatures}>
        {/* Honors the visitor's "reduce motion" setting. */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        {/* Buttons shrink under the finger and spring back. */}
        <Tactile />
      </LazyMotion>
    </HeroUIProvider>
  );
}
