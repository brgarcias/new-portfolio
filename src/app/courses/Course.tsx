'use client';

// HOOKS
import { CSSProperties, useState } from 'react';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import ModalComponent, { openOnKey } from '@/src/components/Modal';
// CONTENT
import { courses } from './courses';

// The colors of the old course tiles, kept as accents.
const accents = [
  '#3399cc',
  '#33cccc',
  '#996699',
  '#c24747',
  '#e2674a',
  '#ffcc66',
];

type CourseProps = (typeof courses)[number] & { index: number };

export default function Course({
  index,
  title,
  subtitle,
  wide,
  description,
  descriptionTitle,
  descriptionSubtitle,
}: Readonly<CourseProps>) {
  const [visible, setVisible] = useState(false);
  const accent = {
    '--accent': accents[index % accents.length],
  } as CSSProperties;

  return (
    <li
      className={`course-card${wide ? ' course-card--wide' : ''}`}
      style={accent}
    >
      <span className="course-card__index" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      {/* The button covers the whole card, so a click anywhere opens it. */}
      <h3 className="course-card__title">
        <button
          type="button"
          className="course-card__button"
          aria-haspopup="dialog"
          onClick={() => setVisible(true)}
          onKeyDown={openOnKey(() => setVisible(true))}
        >
          {title}
        </button>
      </h3>
      <p className="course-card__subtitle">{subtitle}</p>
      <span className="course-card__more" aria-hidden="true">
        View details
        <FontAwesomeIcon icon={faArrowRight} />
      </span>

      <ModalComponent
        visible={visible}
        setVisible={setVisible}
        size="3xl"
        title={descriptionTitle}
        subtitle={descriptionSubtitle}
        focusableBody
      >
        <ol className="course-modules" style={accent}>
          {description.map((item, position) => (
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
    </li>
  );
}
