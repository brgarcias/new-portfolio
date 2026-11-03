// app/providers.tsx
'use client';

import { HeroUIProvider } from '@heroui/react';
import {
  LazyMotion,
  MotionConfig,
  type LazyFeatureBundle,
} from 'framer-motion';
import Tactile from '@/src/components/Tactile';

// Loads framer-motion's DOM animation features on demand, as HeroUI does.
// Without them the blocks of the page never enter, so a download that fails, on
// a bad connection or as the visitor leaves the page, is tried again in a moment.
const loadMotionFeatures: LazyFeatureBundle = () =>
  import('framer-motion')
    .then((module) => module.domAnimation)
    .catch(() =>
      new Promise((done) => setTimeout(done, 2000)).then(loadMotionFeatures),
    );

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
