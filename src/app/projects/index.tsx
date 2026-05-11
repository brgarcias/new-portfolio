"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faSearch,
  faArrowRight,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import "./styles.css";
import { projectsData } from "./projects.data";

/* ─── types ─────────────────────────────────────────────── */
type Project = (typeof projectsData)[number];

/* ─── helpers ───────────────────────────────────────────── */
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

/* ─── component ─────────────────────────────────────────── */
export default function Projects() {
  const [current, setCurrent] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const zoomerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const total = projectsData.length;

  /* ── navigation ─────────────────────────────────────────── */
  const navigate = useCallback(
    (dir: "left" | "right") => {
      if (isOpen) return;
      setCurrent((prev) =>
        dir === "right"
          ? prev < total - 1
            ? prev + 1
            : 0
          : prev > 0
            ? prev - 1
            : total - 1,
      );
    },
    [isOpen, total],
  );

  /* ── keyboard ───────────────────────────────────────────── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isOpen) return;
      if (e.key === "ArrowLeft") navigate("left");
      if (e.key === "ArrowRight") navigate("right");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, navigate]);

  /* ── zoom / open ────────────────────────────────────────── */
  function applyZoomerTransform(el: HTMLDivElement) {
    const area = el.querySelector<HTMLElement>(".zoomer__area");
    if (!area) return;
    const { width: aw, height: ah } = area.getBoundingClientRect();
    const { left, top } = area.getBoundingClientRect();
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const scale = aw / ah < ww / wh ? (ww / aw) * (1 / 3) : (wh / ah) * (1 / 3);
    const tx = ww / 2 - (left + aw / 2);
    const ty = wh / 2 - (top + ah / 2);
    el.style.transform = `translate3d(${tx}px,${ty}px,0) scale3d(${scale},${scale},1)`;
  }

  function openItem() {
    if (isOpen) return;
    const zoomer = zoomerRefs.current[current];
    if (!zoomer) return;

    setIsOpen(true);
    zoomer.classList.add("zoomer--active");
    applyZoomerTransform(zoomer);

    // After zoom transition ends, show content panel
    function onEnd(e: TransitionEvent) {
      if (e.target !== zoomer) return;
      zoomer!.removeEventListener("transitionend", onEnd);

      // reset zoomer silently
      zoomer!.classList.add("zoomer--notrans");
      zoomer!.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";

      // open content
      contentRef.current?.classList.add("content--open");
      const contentItem = document.getElementById(
        projectsData[current].contentId,
      );
      contentItem?.classList.add("content__item--current");
      setTimeout(() => contentItem?.classList.add("content__item--reset"), 0);
    }
    zoomer.addEventListener("transitionend", onEnd);
  }

  /* ── close ──────────────────────────────────────────────── */
  function closeContent() {
    if (isClosing) return;
    setIsClosing(true);

    const contentItem = contentRef.current?.querySelector<HTMLElement>(
      ".content__item--current",
    );
    const zoomer = zoomerRefs.current[current];

    contentRef.current?.classList.remove("content--open");
    contentItem?.classList.remove("content__item--current");

    // wait for content fade out, then animate zoomer back
    function onContentEnd(e: TransitionEvent) {
      if (e.target !== contentItem) return;
      contentItem?.removeEventListener("transitionend", onContentEnd);
      contentItem?.classList.remove("content__item--reset");

      if (!zoomer) {
        setIsOpen(false);
        setIsClosing(false);
        return;
      }

      // bring zoomer back to fill position silently first
      zoomer.classList.add("zoomer--notrans");
      applyZoomerTransform(zoomer);

      // then animate it back to natural size
      setTimeout(() => {
        zoomer.classList.remove("zoomer--notrans");
        zoomer.classList.remove("zoomer--active");
        zoomer.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";
        setIsOpen(false);
        setIsClosing(false);
      }, 25);
    }

    if (contentItem) {
      contentItem.addEventListener("transitionend", onContentEnd);
    } else {
      setIsOpen(false);
      setIsClosing(false);
    }
  }

  /* ── slide size class per project ───────────────────────── */
  const sizeClasses = [
    "zoomer__area--size-2", // iPhone
    "zoomer__area--size-4", // iPad
    "zoomer__area--size-3", // MacBook
    "zoomer__area--size-5", // iMac
    "zoomer__area--size-1", // Apple Watch
  ];

  return (
    <div className="page" id="projectsData">
      <header className="bp-header cf">
        <h1 className="bp-header__title">My Projects</h1>
        <p className="bp-header__desc">
          Some of the projects carried out throughout my career!
        </p>
      </header>

      <div className="container-slider">
        {/* ── Slider ───────────────────────────────────────── */}
        <section className="slider">
          {projectsData.map((project: Project, index: number) => (
            <div
              key={project.contentId}
              className={`slide${index === current ? " slide--current" : ""}`}
              data-content={project.contentId}
            >
              <div className="slide__mover">
                <div
                  className="zoomer flex-center"
                  ref={(el) => {
                    zoomerRefs.current[index] = el;
                  }}
                  style={{ transform: "translate3d(0,0,0) scale3d(1,1,1)" }}
                >
                  <Image
                    className="zoomer__image"
                    src={project.image}
                    alt={project.title}
                    unoptimized
                  />
                  <div className="preview rounded">
                    <Image
                      src={project.previewImage}
                      alt={project.title}
                      unoptimized
                      style={{
                        width: project.imageWidth,
                        height: project.heightWidth,
                      }}
                    />
                    <div
                      className={`zoomer__area ${
                        sizeClasses[index] ?? "zoomer__area--size-2"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <h2 className="slide__title">
                <span>{project.titleSpan}</span> {project.title}
              </h2>
            </div>
          ))}

          {/* ── Nav buttons ─────────────────────────────── */}
          <nav className="slider__nav">
            <button
              className="button button--nav-prev"
              onClick={() => navigate("left")}
              aria-label="Previous Project"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span className="text-hidden">Previous Project</span>
            </button>

            <button
              className="button button--zoom"
              onClick={openItem}
              aria-label="See Details"
            >
              <FontAwesomeIcon icon={faSearch} />
              <span className="text-hidden">See Details</span>
            </button>

            <button
              className="button button--nav-next"
              onClick={() => navigate("right")}
              aria-label="Next Project"
            >
              <FontAwesomeIcon icon={faArrowRight} />
              <span className="text-hidden">Next Project</span>
            </button>
          </nav>
        </section>

        {/* ── Content panel ────────────────────────────────── */}
        <section className="content" ref={contentRef}>
          {projectsData.map((project: Project) => (
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

          <button
            className="button button--close"
            onClick={closeContent}
            aria-label="Close content"
          >
            <FontAwesomeIcon icon={faTimesCircle} />
            <span className="text-hidden">Close content</span>
          </button>
        </section>
      </div>
    </div>
  );
}
