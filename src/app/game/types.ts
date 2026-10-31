import type { SectionId } from '@/src/content/sections';

// A section of the site, as a place in the arena.
export interface Place {
  id: SectionId;
  title: string;
  label: string;
}

// A notice that slides in over the flight for a moment: the mission, when
// an exploration begins; how to fly, to a pilot who has not moved; a
// holocron recovered, with the title of the record it unlocks; or every
// section explored.
export interface Toast {
  key: number;
  kind: 'briefing' | 'hint' | 'holocron' | 'explored';
  id: SectionId;
  count: number;
  record?: string;
}

// How much of the HUD shows: everything, the essentials, or little more than
// the world, the way out and the switch back.
export const hudModes = ['full', 'minimal', 'immersive'] as const;
export type HudMode = (typeof hudModes)[number];
