'use client';

// HOOKS
import { useRef, type CSSProperties } from 'react';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
import { format } from '@/src/i18n/messages';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import Chart from './Chart';
import { PlanReadings } from './FlightPlan';
import { overlay } from './overlay';
import type { Ship } from './ships';
import type { Place } from './types';
import { HolocronIcon, Keycap, Pips } from './ui';
import { useDialog } from './useDialog';
import { biomes } from './world/biomes';
// ICONS
import { BookIcon, CheckIcon, SendIcon, XIcon } from '@/src/components/Icon';

const registerList = (element: HTMLOListElement | null) => {
  overlay.chartList = element;
};

interface GalaxyMapProps {
  // While it fades out, after it was closed: nothing in it answers.
  leaving: boolean;
  ship: Ship;
  activePad: SectionId | null;
  visited: SectionId[];
  found: SectionId[];
  places: Place[];
  course: SectionId | null;
  onCourse: (id: SectionId) => void;
  // Opens a section without flying there.
  onRead: (id: SectionId) => void;
  onClose: () => void;
}

// The navigation chart over the flight: the chart of the platform and the
// destinations, the site's sections on their planets, each with how far
// and which way it lies, live, whether it was explored, and its holocron.
// Picking one sets a course, with a route worked out around what is in the
// way, which the chart shows at once and the flight projects over the world
// when the chart closes, with its button at the end of the list; picking it
// again clears it. The book beside each
// destination reads its section at once, without landing, for whoever came
// for the portfolio more than for the flight. It opens from the radar or
// with M, and closes with its button, with Escape, with M again or with a
// click outside.
export default function GalaxyMap({
  leaving,
  ship,
  activePad,
  visited,
  found,
  places,
  course,
  onCourse,
  onRead,
  onClose,
}: Readonly<GalaxyMapProps>) {
  const t = useI18n().messages.game;
  const sheet = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useDialog(sheet, onClose, close, !leaving);
  const total = places.length;

  const stateOf = (id: SectionId) => {
    if (id === activePad) return 'active';
    return visited.includes(id) ? 'visited' : undefined;
  };

  return (
    <div
      className="game-map"
      data-leaving={leaving ? '' : undefined}
      inert={leaving}
    >
      <button
        type="button"
        className="game-map__backdrop"
        aria-label={t.closeMap}
        tabIndex={-1}
        onClick={onClose}
      />
      <section
        ref={sheet}
        className="game-map__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-map-title"
        tabIndex={-1}
      >
        <header className="game-map__head">
          <div className="game-map__heading">
            <p className="g-label game-map__eyebrow">
              {ship.name} · {t.navComputer}
            </p>
            <h2 id="game-map-title" className="game-map__title">
              {t.map}
            </h2>
          </div>
          <dl className="game-map__stats">
            <div>
              <dt className="g-label">{t.sections}</dt>
              <dd>
                <Pips count={visited.length} total={total} />
                <span className="g-num">
                  {format(t.visited, {
                    count: String(visited.length),
                    total: String(total),
                  })}
                </span>
              </dd>
            </div>
            <div>
              <dt className="g-label">{t.holocronsLabel}</dt>
              <dd>
                <Pips count={found.length} total={total} kind="diamond" />
                <span className="g-num">
                  {format(t.holocrons, {
                    count: String(found.length),
                    total: String(total),
                  })}
                </span>
              </dd>
            </div>
          </dl>
          <button
            ref={close}
            type="button"
            className="g-btn game-map__close"
            // With the key it shows, so a voice command can call it by that.
            aria-label={`${t.closeMap}, Esc`}
            aria-keyshortcuts="Escape"
            onClick={onClose}
          >
            <XIcon />
            <Keycap>Esc</Keycap>
          </button>
        </header>
        <div className="game-map__body">
          <div className="game-map__chart">
            <Chart
              activePad={activePad}
              visited={visited}
              found={found}
              course={course}
              label={t.map}
            />
          </div>
          <div className="game-map__side">
            <p className="game-map__hint">{t.chartHint}</p>
            <ol ref={registerList} className="game-map__legend">
              {places.map((place, index) => {
                const state = stateOf(place.id);
                const picked = course === place.id;
                const status = picked
                  ? t.courseSet
                  : state === 'active'
                    ? t.youAreHere
                    : state === 'visited'
                      ? t.sectionOpened
                      : t.notOpened;
                return (
                  <li
                    key={place.id}
                    data-state={state}
                    style={
                      {
                        '--accent': biomes[place.id].accent,
                        '--i': index,
                      } as CSSProperties
                    }
                  >
                    <button
                      type="button"
                      className="destination"
                      aria-pressed={picked}
                      onClick={() => onCourse(place.id)}
                    >
                      {/* The name is what the button shows, after what it
                          does: "Set a course for" and the place. */}
                      <span className="g-sr">
                        {t.setCourse.split('{place}')[0]}
                      </span>
                      <span
                        className="destination__index g-num"
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="destination__name">
                        <strong>{biomes[place.id].planet}</strong>
                        <small>{place.title}</small>
                      </span>
                      <span
                        className="destination__nav g-num"
                        aria-hidden="true"
                      >
                        <span data-distance={place.id}>— m</span>
                        <span data-bearing={place.id}>—°</span>
                      </span>
                      <span
                        className="destination__state"
                        data-state={picked ? 'course' : state}
                      >
                        {picked && <SendIcon />}
                        {!picked && state === 'visited' && <CheckIcon />}
                        {status}
                      </span>
                      <span
                        className="destination__holocron"
                        data-found={found.includes(place.id) ? '' : undefined}
                        title={
                          found.includes(place.id)
                            ? t.holocronFound
                            : t.holocronHidden
                        }
                      >
                        <HolocronIcon />
                      </span>
                    </button>
                    <button
                      type="button"
                      className="g-btn g-btn--icon destination__read"
                      aria-label={format(t.readRemotely, {
                        place: `${biomes[place.id].planet}, ${place.title}`,
                      })}
                      data-tip={t.remoteAccess}
                      data-tip-side="right"
                      onClick={() => onRead(place.id)}
                    >
                      <BookIcon />
                    </button>
                  </li>
                );
              })}
            </ol>
            {course && (
              <div className="flight-plan">
                <p className="flight-plan__to">
                  <span className="g-label">{t.flightPlan}</span>
                  <strong>{biomes[course].planet}</strong>
                </p>
                <div aria-hidden="true">
                  <PlanReadings className="plan-readings" />
                </div>
                <button
                  type="button"
                  className="g-btn g-btn--primary flight-plan__fly"
                  onClick={onClose}
                >
                  <SendIcon />
                  {t.flyCourse}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
