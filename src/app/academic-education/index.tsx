"use client";

// HOOKS
import { useEffect, useState } from "react";
// FONT AWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faUniversity } from "@fortawesome/free-solid-svg-icons";
// CSS
import "./styles.css";

export default function AcademicEducation() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setActiveTab(0);
  }, []);
  return (
    <div className="page" id="academic-education">
      <header className="bp-header cf">
        <h1 className="bp-header__title">Academic Education</h1>
        <p className="bp-header__desc">
          Postgraduate Coming Soon{" "}
          <FontAwesomeIcon icon={faHeart} style={{ color: "red" }} />
        </p>
        <p className="info">
          &quot;The learned man is a discoverer of facts that already exist -
          but the wise man is a creator of values that do not exist and that he
          makes exist.&quot; &mdash;
          <span className="blue">
            <em> Albert Einstein</em>
          </span>
        </p>
      </header>

      <div className="time-line">
        <div className="progress">
          <div className="progress_inner">
            <div className="progress_inner__step">
              <label htmlFor="step-1">Elementary School</label>
            </div>
            <div className="progress_inner__step">
              <label htmlFor="step-2">High school</label>
            </div>
            <div className="progress_inner__step">
              <label htmlFor="step-3">University Education</label>
            </div>
            <div className="progress_inner__step">
              <label htmlFor="step-4">Postgraduate</label>
            </div>
            <div className="progress_inner__step">
              <label htmlFor="step-5">Doctorate Degree</label>
            </div>
            <input id="step-1" name="step" type="radio" />
            <input id="step-2" name="step" type="radio" />
            <input id="step-3" name="step" type="radio" />
            <input id="step-4" name="step" type="radio" />
            <input id="step-5" name="step" type="radio" />
            <div className="progress_inner__bar"></div>
            <div className="progress_inner__bar--set"></div>
            <div className="progress_inner__tabs">
              <div className="tab tab-0">
                <h1>Colégio Salesiano Santa Teresinha</h1>
                <p>
                  I began my education at the age of 3 in 2002 at Salesian
                  School Santa Teresinha. My mother worked as a teaching
                  assistant at the school, which made it possible for me to
                  attend on a full scholarship. This excellent school played a
                  pivotal role in my early development, imparting a variety of
                  values and fundamental principles crucial for a child&apos;s
                  growth.
                </p>
              </div>
              <div className="tab tab-1">
                <h1>Colégio Salesiano Santa Teresinha</h1>
                <p>
                  I continued my high school studies at Salesian School Santa
                  Teresinha, which greatly aided me in preparing for exams and
                  practice tests, including the ENEM and FUVEST. After
                  completing high school, I spent one year in a preparatory
                  course at ETAPA. I successfully passed the first phase of the
                  FUVEST, but unfortunately, I didn&apos;t make it through the
                  second phase.
                </p>
              </div>
              <div className="tab tab-2">
                <h1>Universidade São Judas Tadeu</h1>
                <p>
                  Although I completed my studies at São Judas Tadeu University,
                  I began my undergraduate education in 2018 at Anhembi Morumbi
                  University, majoring in Computer Engineering. I really enjoyed
                  the program and the university&apos;s excellent facilities,
                  and my studies were progressing well. However, after the first
                  semester, the tuition fees became prohibitively high, and I
                  didn&apos;t have the financial resources to continue. So, in
                  mid-2018, I transferred to São Judas Tadeu University and
                  switched to the Computer Science program, ultimately
                  graduating in the first semester of 2022.
                </p>
              </div>
              <div className="tab tab-3">
                <h1>Which course? <FontAwesomeIcon icon={faUniversity} /></h1>
                <p>A dream to come true...</p>
              </div>
              <div className="tab tab-4">
                <h1>When will be?</h1>
                <p>But I don&apos;t want to be called a doctor!</p>
              </div>
            </div>
            <div className="progress_inner__status">
              <div className="box_base"></div>
              <div className="box_lid"></div>
              <div className="box_ribbon"></div>
              <div className="box_bow">
                <div className="box_bow__left"></div>
                <div className="box_bow__right"></div>
              </div>
              <div className="box_item"></div>
              <div className="box_tag"></div>
              <div className="box_string"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
