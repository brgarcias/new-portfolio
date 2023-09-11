"use client";
// NEXT
import Link from "next/link";
// HOOKS
import { useEffect } from "react";
// FONT AWESOME
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// SCRIPT
import { loadScript } from "./load";
// CONTENT
import { navItems, socialLinks } from "./content";

export default function Header() {
  useEffect(() => {
    loadScript();
  }, []);

  return (
    <>
      <nav className="pages-nav">
        {navItems.map((item, index) => (
          <div key={index} className="pages-nav__item">
            <Link className="link link--page" href={item.href}>
              {item.text}
            </Link>
          </div>
        ))}
        <div className="pages-nav__item pages-nav__item--small">
          <Link className="link link--page link--faded" href="#contact">
            Contact
          </Link>
        </div>
        <div className="pages-nav__item pages-nav__item--social">
          {socialLinks.map((link, index) => (
            <Link
              key={index}
              className="link link--social link--faded"
              href={link.href}
              target="_blank"
            >
              <FontAwesomeIcon icon={link.icon} />
              <span className="text-hidden">{link.text}</span>
            </Link>
          ))}
        </div>
      </nav>
      <button className="menu-button">
        <span>Menu</span>
      </button>
    </>
  );
}
