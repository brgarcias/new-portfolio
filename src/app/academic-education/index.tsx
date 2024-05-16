"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import "./styles.css";
import { tabsContent } from "./sections";

export default function AcademicEducation() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const step1 = document.getElementById(`step-1`) as HTMLInputElement;
    if (!step1) return;
    step1.checked = true;
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
            {tabsContent.map((tab, index) => (
              <input
                key={index}
                value={index}
                id={`step-${index + 1}`}
                name="step"
                type="radio"
                checked={activeTab === index}
                onChange={() => setActiveTab(index)}
              />
            ))}
            <div className="progress_inner__bar"></div>
            <div className="progress_inner__bar--set"></div>
            <div className="progress_inner__tabs">
              {tabsContent.map((tab, index) => (
                <div
                  key={index}
                  className={`tab tab-${index}`}
                  style={{ display: activeTab === index ? "block" : "none" }}
                >
                  <h1>{tab.title}</h1>
                  <p>{tab.content}</p>
                </div>
              ))}
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
