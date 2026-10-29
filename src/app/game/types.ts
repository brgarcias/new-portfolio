import type { SectionId } from '@/src/content/sections';

// A section of the site, as a place in the arena.
export interface Place {
  id: SectionId;
  title: string;
  label: string;
}
