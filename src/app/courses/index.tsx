// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
import Course from './Course';
// CONTENT
import type { Course as CourseContent, SectionHeader } from '@/src/content';
// CSS
import './styles.css';

interface CoursesProps {
  header: SectionHeader;
  courses: CourseContent[];
}

export default function Courses({ header, courses }: Readonly<CoursesProps>) {
  return (
    <Section header={header} className="courses">
      <Reveal className="course-list-wrap">
        <ul className="course-list">
          {courses.map((course, index) => (
            <Course key={course.slug} index={index} course={course} />
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
