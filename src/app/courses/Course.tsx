'use client';

// HOOKS
import { CSSProperties, useState } from 'react';
// ICONS
import { ArrowRightIcon } from '@/src/components/Icon';
// COMPONENTS
import ModalComponent from '@/src/components/Modal/Lazy';
import { openOnKey } from '@/src/components/Modal/openOnKey';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// CONTENT
import type { Course as CourseContent } from '@/src/content';

// The colors of the old course tiles, kept as accents.
const accents = [
  '#3399cc',
  '#33cccc',
  '#996699',
  '#c24747',
  '#e2674a',
  '#ffcc66',
];

interface CourseProps {
  course: CourseContent;
  index: number;
}

// A course as a line of the list. With modules to show, the line is a button
// that opens them in a dialog.
export default function Course({ course, index }: Readonly<CourseProps>) {
  const t = useI18n().messages.courses;
  const { title, subtitle, dialogTitle, dialogSubtitle, modules = [] } = course;
  const [visible, setVisible] = useState(false);
  const accent = {
    '--accent': accents[index % accents.length],
  } as CSSProperties;

  return (
    <li className="course" style={accent}>
      <span className="course__dot" aria-hidden="true" />
      <h3 className="course__title">
        {modules.length > 0 ? (
          <button
            type="button"
            className="course__button"
            aria-haspopup="dialog"
            onClick={() => setVisible(true)}
            onKeyDown={openOnKey(() => setVisible(true))}
          >
            {title}
          </button>
        ) : (
          title
        )}
      </h3>
      <p className="course__subtitle">{subtitle}</p>
      {modules.length > 0 && (
        <span className="course__more" aria-hidden="true">
          {t.details}
          <ArrowRightIcon />
        </span>
      )}

      {modules.length > 0 && (
        <ModalComponent
          visible={visible}
          setVisible={setVisible}
          size="3xl"
          title={dialogTitle ?? title}
          subtitle={dialogSubtitle}
          focusableBody
        >
          <ol className="course-modules" style={accent}>
            {modules.map((item, position) => (
              <li key={item.title} className="course-modules__item">
                <span className="course-modules__index" aria-hidden="true">
                  {String(position + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="course-modules__title">{item.title}</p>
                  <p className="course-modules__text">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </ModalComponent>
      )}
    </li>
  );
}
