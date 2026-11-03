import type { SectionId } from '@/src/content/sections';
import type { Sector } from './world/biomes';

// When a planet's title shows: each time the ship enters the planet. Flying
// along a border must not make the names blink, though, so the ship has to
// stay a moment in a planet for it to count, and a moment out of one does not
// count as having left it. Pure arithmetic, so the tests can run it too.

// How long the ship stays in a planet before it counts as having entered it,
// and how long out of the last one named before it counts as having left.
const settleTime = 0.3;
const leaveTime = 2;

export interface TitleWatch {
  sector: Sector;
  // How long the ship has been in that sector.
  settled: number;
  // The planet named last, and how long the ship has been out of it.
  named: SectionId | null;
  away: number;
}

export const newTitleWatch = (): TitleWatch => ({
  sector: 'hub',
  settled: 0,
  named: null,
  away: 0,
});

// One frame of the flight: the planet whose title to show now, if any.
export function enteredPlanet(
  watch: TitleWatch,
  sector: Sector,
  dt: number,
): SectionId | null {
  if (sector !== watch.sector) {
    watch.sector = sector;
    watch.settled = 0;
  }
  watch.settled += dt;
  if (sector !== watch.named) {
    watch.away += dt;
  } else if (watch.away < leaveTime) {
    watch.away = 0;
    return null;
  }
  if (sector === 'hub' || watch.settled < settleTime) return null;
  watch.named = sector;
  watch.away = 0;
  return sector;
}
