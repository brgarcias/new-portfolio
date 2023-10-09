"use client";

// NEXT
import Image from "next/image";
// HOOKS
import { useEffect } from "react";
// FONTAWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSearch,
  faArrowRight,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
// CSS
import "./styles.css";
// PROJECTS DATA
import { projects } from "./projects";
// COMPONENT
import renderProjects from "./Projects";
import { loadScript } from "./loadScript";

export default function Projects() {
  useEffect(() => {
    loadScript();
  }, []);
  return (
    <div className="page" id="projects">
      <header className="bp-header cf">
        <h1 className="bp-header__title">My Projects</h1>
        <p className="bp-header__desc">
          Some of the projects carried out throughout my career!
        </p>
      </header>

      <div className="container-slider">
        <section className="slider">
          {renderProjects(projects)}

          <nav className="slider__nav">
            <button className="button button--nav-prev">
              <FontAwesomeIcon icon={faArrowLeft} />
              <span className="text-hidden">Previous Project</span>
            </button>
            <button className="button button--zoom">
              <FontAwesomeIcon icon={faSearch} />
              <span className="text-hidden">See Details</span>
            </button>
            <button className="button button--nav-next">
              <FontAwesomeIcon icon={faArrowRight} />
              <span className="text-hidden">Next Project</span>
            </button>
          </nav>
        </section>

        <section className="content">
          {projects.map((project) => (
            <div
              className="content__item"
              id={project.contentId}
              key={project.contentId}
            >
              <Image
                className="content__item-img rounded-right"
                src={project.insideImage}
                alt={project.insideTitle}
                unoptimized
              />
              <div className="content__item-inner">
                <h2>{project.insideTitle}</h2>
                <h3>{project.insideSubtitle}</h3>
                <p>{project.description}</p>
                <p style={{ marginTop: "15px" }}>
                  <a
                    href={project.websiteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    See more about the website &rarr;
                  </a>
                </p>
              </div>
            </div>
          ))}

          <button className="button button--close">
            <FontAwesomeIcon icon={faTimesCircle} />
            <span className="text-hidden">Close content</span>
          </button>
        </section>
      </div>
    </div>
  );
}
