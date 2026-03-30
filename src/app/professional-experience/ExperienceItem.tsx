"use client";

import { useState } from "react";

// FONT AWESOME
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface ExperienceItemProps {
  date: string;
  company: string;
  icon: IconProp;
  title: string;
  description: string;
  duration: string;
  defaultOpen?: boolean;
}

export default function ExperienceItem({
  date,
  company,
  icon,
  title,
  description,
  duration,
  defaultOpen = false,
}: Readonly<ExperienceItemProps>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <li>
      <time className="cbp_tmtime" dateTime={date}>
        <span>
          {date} · {duration}
        </span>
        <span>{company}</span>
      </time>

      <div className="cbp_tmicon">
        <FontAwesomeIcon icon={icon} />
      </div>

      <div className="cbp_tmlabel">
        {/* header clickable */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="experience-header"
        >
          <h2 className="heading">{title}</h2>

          <FontAwesomeIcon
            icon={faChevronDown}
            className={`chevron ${isOpen ? "open" : ""}`}
          />
        </button>

        {/* collapsible body */}
        <div className={`experience-body ${isOpen ? "open" : ""}`}>
          <div
            className="description"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      </div>
    </li>
  );
}
