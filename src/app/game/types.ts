import type { SectionId } from '@/src/content/sections';

// A section of the site, as a place in the arena.
export interface Place {
  id: SectionId;
  title: string;
  label: string;
}

// A notice that slides in over the flight for a moment: a holocron
// recovered, or every section explored.
export interface Toast {
  key: number;
  kind: 'holocron' | 'explored';
  id: SectionId;
  count: number;
}
