// CONTENT
import { sectionIds, type SectionId } from '@/src/content/sections';

// What the game keeps between visits: the sections landed on, the
// holocrons recovered and the records read in the archive. It lives in
// localStorage, under a version number, so a later page can tell an older
// save apart; reading keeps only the ids of known sections, each once, so
// a save that is damaged, edited by hand or from another version never
// breaks the game, and without storage the game plays as before, only
// forgetting at the end of the page.
const storageKey = 'progress';
const version = 1;

export interface Progress {
  visited: SectionId[];
  found: SectionId[];
  read: SectionId[];
}

export const emptyProgress: Progress = { visited: [], found: [], read: [] };

const only = (value: unknown): SectionId[] =>
  Array.isArray(value) ? sectionIds.filter((id) => value.includes(id)) : [];

export function loadProgress(): Progress {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return emptyProgress;
    const data: unknown = JSON.parse(stored);
    if (typeof data !== 'object' || data === null) return emptyProgress;
    const { visited, found, read } = data as Record<string, unknown>;
    const recovered = only(found);
    return {
      visited: only(visited),
      found: recovered,
      // Only a record that was unlocked can have been read.
      read: only(read).filter((id) => recovered.includes(id)),
    };
  } catch {
    return emptyProgress;
  }
}

export function saveProgress(progress: Progress) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version, ...progress }));
  } catch {}
}
