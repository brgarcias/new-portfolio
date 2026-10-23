// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
import Course from './Course';
// CONTENT
import { courses } from './courses';
// CSS
import './styles.css';

export default function Courses() {
  return (
    <Section
      id="courses"
      description={
        <>
          Continuous development looking for an opportunity to apply my{' '}
          <span className="text-gradient">experience</span>!
        </>
      }
      quote={{
        text: 'The saddest aspect of life today is that science gains in knowledge faster than society in wisdom.',
        author: 'Isaac Asimov',
      }}
    >
      <Reveal className="course-grid-wrap">
        <ul className="course-grid">
          {courses.map((course, index) => (
            <Course key={course.id} index={index} {...course} />
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
