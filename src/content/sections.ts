// The sections, by the place each list is for. Kept apart from the readers of
// content/, so the browser code can use it. An id is the section's anchor.

// The places of the game, one planet each, in the order of the planets.
export const sectionIds = [
  'about',
  'experience',
  'education',
  'courses',
  'projects',
  'contributing',
  'contact',
] as const;

export type SectionId = (typeof sectionIds)[number];

// The sections of the home page, in the order they show: first the work, then
// what backs it up, and the rest for whoever keeps reading.
export const pageIds = [
  'projects',
  'expertise',
  'experience',
  'about',
  'education',
  'courses',
  'contributing',
  'contact',
] as const;

export type PageId = (typeof pageIds)[number];

// The ones the bar links to, for what most visitors look for. The menu has
// them all.
export const barIds: readonly PageId[] = [
  'projects',
  'expertise',
  'experience',
  'about',
  'contact',
];
