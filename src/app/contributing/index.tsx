"use client";

import "./styles.css";

import { RefObject, useEffect, useRef } from "react";
import {items} from "@/src/app/contributing/contributing";
import ContributingItem from "@/src/app/contributing/ContributingItem";

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            observer.unobserve(el);
          }
        },
        { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

export default function Contributing() {
  const narrativeRef   = useReveal(0.1)  as RefObject<HTMLElement>;
  const galleryRef     = useReveal(0.08) as RefObject<HTMLElement>;
  const closingRef     = useReveal(0.1)  as RefObject<HTMLElement>;

  return (
      <div className="page" id="contributing">

        {/* ── HERO ──────────────────────────────────────────── */}
        <header className="bp-header cf">
          <h1 className="bp-header__title">Contributing</h1>
          <p className="bp-header__desc">
            Developing the community side
            <span className="purple"> the most important</span>!
          </p>
          <p className="info">
            &quot;Our lives begin to end the day we remain silent about the things
            that matter.&quot; &mdash;
            <span className="blue">
            <em> Martin Luther King Jr.</em>
          </span>
          </p>
        </header>

        {/* ── NARRATIVE ─────────────────────────────────────── */}
        <section className="contrib-section contrib-narrative reveal" ref={narrativeRef}>
          <div className="contrib-label">/ Why this matters</div>
          <div className="contrib-narrative__body">
            <p>
              Alongside my work as a software engineer, I actively participate in
              volunteer initiatives supporting children, families in vulnerable
              situations, and elderly communities. These experiences reinforce my
              belief that technology professionals should generate impact not only
              through systems — but through people.
            </p>
            <p>
              Contributing to social initiatives keeps me connected with
              real-world challenges and strengthens values that also shape how I
              collaborate professionally: empathy, responsibility, and long-term
              thinking.
            </p>
          </div>
        </section>

        {/* ── GALLERY + INITIATIVES ─────────────────────────── */}
        <section className="contrib-section contrib-gallery reveal" ref={galleryRef}>
          <div className="contrib-section__header">
            <div className="contrib-label">/ Initiatives &amp; Gallery</div>
            <h2 className="contrib-title">Initiatives I participated in</h2>
            <p className="contrib-hint">
              <span className="contrib-hint__dot" aria-hidden="true" />
              <span className="contrib-hint__text" />
            </p>
          </div>

          <div className="contrib-grid">
            {items.map((item, i) => (
                <ContributingItem key={item.number} item={item} index={i} />
            ))}
          </div>
        </section>

        {/* ── CLOSING ───────────────────────────────────────── */}
        <section className="contrib-section contrib-closing reveal" ref={closingRef}>
          <div className="contrib-closing__inner">

            <div className="contrib-stats">
              <div className="contrib-stat">
                <strong>4<sup>+</sup></strong>
                <span>initiatives</span>
              </div>
              <div className="contrib-stat">
                <strong>100<sup>+</sup></strong>
                <span>volunteer hours</span>
              </div>
              <div className="contrib-stat">
                <strong>∞</strong>
                <span>communities</span>
              </div>
            </div>

            <div className="contrib-closing__text">
              <p>
                Staying involved with community initiatives helps me maintain
                perspective about the purpose behind everything we build as
                engineers.
              </p>
              <p className="contrib-closing__highlight">
                Technology transforms systems —
                <em>people transform lives.</em>
              </p>
            </div>

          </div>
        </section>

      </div>
  );
}
