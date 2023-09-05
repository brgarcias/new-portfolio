// CSS
import "./styles.css";
// COMPONENT
import Course from "./Course";
// DATA
import { courses } from "./courses";

export default function Courses() {
  return (
    <div className="page" id="courses">
      <header className="bp-header cf">
        <h1 className="bp-header__title">Courses &amp; Certifications</h1>
        <p className="bp-header__desc">
          Continuous development looking for an opportunity to apply my
          <span className="purple"> experience</span>!
        </p>
        <p className="info">
          &quot;The saddest aspect of life today is that science gains in
          knowledge faster than society in wisdom.&quot; &mdash;
          <span className="blue">
            <em> Isaac Asimov</em>
          </span>
        </p>
      </header>

      <div className="cursos wrapper">
        <ul id="rb-grid" className="rb-grid clearfix">
          {courses.map((course, index) => (
            <Course key={index} {...course} />
          ))}
        </ul>
      </div>
    </div>
  );
}
