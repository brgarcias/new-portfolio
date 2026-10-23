// CSS
import './styles.css';
// COMPONENT
import Course from './Course';
// DATA
import { courses } from './courses';
// COMPONENTS
import Section from '@/src/components/Section';

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
      <div className="cursos wrapper">
        <ul id="rb-grid" className="rb-grid clearfix">
          {courses.map((course, index) => (
            <Course key={index} {...course} />
          ))}
        </ul>
      </div>
    </Section>
  );
}
