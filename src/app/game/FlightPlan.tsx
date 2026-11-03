'use client';

// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRoute, faXmark } from '@fortawesome/free-solid-svg-icons';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { SectionId } from '@/src/content/sections';
// GAME
import { overlay } from './overlay';
import { biomes } from './world/biomes';

const registerLock = (element: HTMLDivElement | null) => {
  overlay.courseLock = element;
};
const registerArrow = (element: HTMLSpanElement | null) => {
  overlay.courseArrow = element;
};
const registerBar = (element: HTMLSpanElement | null) => {
  overlay.courseBar = element;
};
const registerStrip = (element: HTMLDivElement | null) => {
  overlay.courseStrip = element;
};

// How far along the route, how long and how many gates, which the frame loop
// fills (instruments.ts).
export function PlanReadings({ className }: { className: string }) {
  const t = useI18n().messages.game;
  return (
    <dl className={className}>
      <div>
        <dt className="g-label">{t.planDistance}</dt>
        <dd className="g-num" data-plan="distance">
          — m
        </dd>
      </div>
      <div>
        <dt className="g-label">{t.planTime}</dt>
        <dd className="g-num" data-plan="time">
          — s
        </dd>
      </div>
      <div>
        <dt className="g-label">{t.planGates}</dt>
        <dd className="g-num" data-plan="gates">
          —
        </dd>
      </div>
    </dl>
  );
}

// The lock on the destination, over its pad on the picture or at the edge of
// the free part of it, with an arrow pointing the way. The frame loop moves
// it (Labels.tsx), and it opens anew with each course.
export function CourseLock({ course }: { course: SectionId }) {
  return (
    <div
      key={course}
      ref={registerLock}
      className="course-lock"
      data-edge="false"
      style={{ display: 'none' }}
      aria-hidden="true"
    >
      <span className="course-lock__frame">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span ref={registerArrow} className="course-lock__arrow" />
      <span className="course-lock__text">
        <b>{biomes[course].planet}</b>
        <span className="g-num" data-plan="distance">
          — m
        </span>
      </span>
    </div>
  );
}

// The plan on a strip under the compass: where it leads, the readings, a bar
// of the way flown and the button that clears it. A screen reader hears the
// plan from the status beside it, in the HUD.
export function CourseStrip({
  course,
  title,
  onClear,
}: {
  course: SectionId;
  title?: string;
  onClear: () => void;
}) {
  const t = useI18n().messages.game;
  return (
    <div ref={registerStrip} className="course-strip">
      <FontAwesomeIcon icon={faRoute} className="course-strip__icon" />
      <p className="course-strip__plan" aria-hidden="true">
        <span className="g-label">
          <span className="course-strip__label">{t.flightPlan}</span>
          <span className="course-strip__notice">{t.recalculating}</span>
        </span>
        <strong>{biomes[course].planet}</strong>
        {title && <small> · {title}</small>}
      </p>
      <div aria-hidden="true" className="course-strip__readings">
        <PlanReadings className="plan-readings" />
      </div>
      <button
        type="button"
        className="g-btn g-btn--icon course-strip__clear"
        aria-label={t.clearCourse}
        onClick={onClear}
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
      <span className="course-strip__bar" aria-hidden="true">
        <span ref={registerBar} />
      </span>
    </div>
  );
}
