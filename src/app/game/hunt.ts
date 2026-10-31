import type { SectionId } from '@/src/content/sections';

// The hunt for the holocrons, as the frame loop sees it: which were found
// and how long ago, for the one just found to flare and vanish; and the
// planets the ship has entered, whose titles show only the first time. It
// lasts the page, across flights, like the sections opened.
export const hunt = {
  found: new Set<SectionId>(),
  // Seconds since each was found.
  age: new Map<SectionId, number>(),
  entered: new Set<SectionId>(),
};
