// The sections of the home page, in order. The id is the section's anchor.
// Kept apart from the readers of content/, so the browser code can use it.
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
