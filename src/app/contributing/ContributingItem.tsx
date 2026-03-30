"use client";

import { useState } from "react";

import Image from "next/image";
import { items } from "@/src/app/contributing/contributing";

export default function ContributingItem({ item, index }: { item: (typeof items)[0]; index: number;}) {
    const [active, setActive] = useState(false);

    return (
        <figure
            className={`c-card${active ? " c-card--active" : ""}`}
            style={{ "--i": index } as React.CSSProperties}
            onMouseEnter={() => setActive(true)}
            onMouseLeave={() => setActive(false)}
            onClick={() => setActive((v) => !v)}
            aria-label={item.title}
        >
            {/* Image: Next.js static import gives us src + width + height.
          We let it render naturally inside the wrapper, then CSS
          stretches it to fill via object-fit. */}
            <div className="c-card__img-wrap">
                <Image
                    src={item.src}
                    alt={item.alt}
                    unoptimized
                    // className="c-card__img"
                />
            </div>

            {/* always-visible strip */}
            <div className="c-card__strip">
                <span className="c-card__num">{item.number}</span>
                <span className="c-card__label">{item.label}</span>
            </div>

            {/* hover / tap overlay */}
            <div className="c-card__overlay">
                <div className="c-card__overlay-inner">
                    <span className="c-card__overlay-num">{item.number}</span>
                    <h3 className="c-card__overlay-title">{item.title}</h3>
                    <p className="c-card__overlay-desc">{item.desc}</p>
                </div>
            </div>
        </figure>
    );
}