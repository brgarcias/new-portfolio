"use client";
// NEXT
import Link from "next/link";
// HOOKS
import { useEffect } from "react";
// FONT AWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import {
  faGithub,
  faLinkedin,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import { loadScript } from "./load";

export default function Header() {
  useEffect(() => {
    loadScript();
  }, []);

  return (
    <>
      <nav className="pages-nav">
        <div className="pages-nav__item">
          <Link className="link link--page" href="#about-me">
            About Me
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="#professional-experience">
            Professional Experience
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="#academic-education">
            Academic Education
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="#courses">
            Courses &amp; Certifications
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="#projects">
            Projects
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="#contributing">
            Contributing
          </Link>
        </div>

        <div className="pages-nav__item pages-nav__item--small">
          <Link className="link link--page link--faded" href="#contact">
            Contact
          </Link>
        </div>

        <div className="pages-nav__item pages-nav__item--social">
          <Link
            className="link link--social link--faded"
            href="mailto:bruno-151299@hotmail.com"
            target="_blank"
          >
            <FontAwesomeIcon icon={faEnvelope} />
            <span className="text-hidden">Email</span>
          </Link>
          <Link
            className="link link--social link--faded"
            href="https://www.linkedin.com/in/bruno-garcia-9854b1161/"
            target="_blank"
          >
            <FontAwesomeIcon icon={faLinkedin} />
            <span className="text-hidden">LinkedIn</span>
          </Link>
          <Link
            className="link link--social link--faded"
            href="https://api.whatsapp.com/send?phone=5511996969301&text=Olá,%20Bruno!%20Gostei%20muito%20do%20seu%20portfolio."
            target="_blank"
          >
            <FontAwesomeIcon icon={faWhatsapp} />
            <span className="text-hidden">Whatsapp</span>
          </Link>
          <Link
            className="link link--social link--faded"
            href="https://github.com/brgarcias"
            target="_blank"
          >
            <FontAwesomeIcon icon={faGithub} />
            <span className="text-hidden">Git Hub</span>
          </Link>
        </div>
      </nav>
      <button className="menu-button">
        <span>Menu</span>
      </button>
    </>
  );
}
