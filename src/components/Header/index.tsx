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

export default function Header() {
  useEffect(() => {
    const supportsTransitions = "transition" in document.documentElement.style;

    function onEndTransition(el: HTMLElement, callback: () => void) {
      function onEndCallbackFn(ev: TransitionEvent) {
        if (supportsTransitions) {
          if (ev.target !== el) return;
          el.removeEventListener("transitionend", onEndCallbackFn);
        }
        if (callback && typeof callback === "function") {
          callback.call(el);
        }
      }
      if (supportsTransitions) {
        el.addEventListener("transitionend", onEndCallbackFn);
      } else {
        onEndCallbackFn({} as TransitionEvent);
      }
    }

    const stack: HTMLElement | null = document.querySelector(".pages-stack");
    const pages: any = Array.from(stack?.children || []);
    const pagesTotal = pages.length;
    let current = 0;
    const menuCtrl = document.querySelector("button.menu-button");
    const nav = document.querySelector(".pages-nav");
    const navItems = Array.from(nav?.querySelectorAll(".link--page") || []);
    let isMenuOpen = false;

    function init() {
      buildStack();
      initEvents();
    }

    function buildStack() {
      const stackPagesIdxs = getStackPagesIdxs();

      pages.forEach((page: HTMLElement, i: number) => {
        const posIdx = stackPagesIdxs.indexOf(i);

        if (current !== i) {
          page.classList.add("page--inactive");

          if (posIdx !== -1) {
            page.style.transform = "translate3d(0,100%,0)";
          } else {
            page.style.transform = "translate3d(0,75%,-300px)";
          }
        } else {
          page.classList.remove("page--inactive");
        }

        page.style.zIndex =
          i < current ? current - i + "" : pagesTotal + current - i + "";

        if (posIdx !== -1) {
          page.style.opacity = (1 - 0.1 * posIdx).toFixed(2);
        } else {
          page.style.opacity = "0";
        }
      });
    }

    function initEvents() {
      menuCtrl?.addEventListener("click", toggleMenu);

      navItems.forEach((item) => {
        const pageid = item.getAttribute("href")?.slice(1);
        if (!pageid) return;
        item.addEventListener("click", (ev) => {
          ev.preventDefault();
          openPage(pageid);
        });
      });

      pages.forEach((page: HTMLElement) => {
        const pageid = page.getAttribute("id");
        if (!pageid) return;
        page.addEventListener("click", (ev) => {
          if (isMenuOpen) {
            ev.preventDefault();
            openPage(pageid);
          }
        });
      });

      document.addEventListener("keydown", (ev) => {
        if (!isMenuOpen) return;
        const keyCode = ev.keyCode || ev.which;
        if (keyCode === 27) {
          closeMenu();
        }
      });
    }

    function toggleMenu() {
      if (isMenuOpen) {
        closeMenu();
      } else {
        openMenu();
        isMenuOpen = true;
      }
    }

    function openMenu() {
      menuCtrl?.classList.add("menu-button--open");
      stack?.classList.add("pages-stack--open");
      nav?.classList.add("pages-nav--open");

      const stackPagesIdxs = getStackPagesIdxs();
      stackPagesIdxs.forEach((i) => {
        const page = pages[i];
        if (!page) return;
        page.style.transform = `translate3d(0, 75%, ${parseInt(
          -1 * 200 - 50 * i + ""
        )}px)`;
      });
    }

    function closeMenu() {
      openPage();
    }

    function openPage(id?: string) {
      const futurePage = id ? document.getElementById(id) : pages[current];
      if (!futurePage) return;
      const futureCurrent = pages.indexOf(futurePage);
      const stackPagesIdxs = getStackPagesIdxs(futureCurrent);

      if (futurePage) {
        futurePage.style.transform = "translate3d(0, 0, 0)";
        futurePage.style.opacity = "1";
      }

      if (id) {
        current = futureCurrent;
      }

      buildStack();

      menuCtrl?.classList.remove("menu-button--open");
      nav?.classList.remove("pages-nav--open");

      onEndTransition(futurePage || document.createElement("div"), () => {
        stack?.classList.remove("pages-stack--open");
        buildStack();
        isMenuOpen = false;
      });
    }

    function getStackPagesIdxs(excludePageIdx?: number) {
      const nextStackPageIdx = current + 1 < pagesTotal ? current + 1 : 0;
      const nextStackPageIdx_2 = current + 2 < pagesTotal ? current + 2 : 1;
      const idxs = [];

      const excludeIdx = excludePageIdx || -1;

      if (excludePageIdx !== current) {
        idxs.push(current);
      }
      if (excludePageIdx !== nextStackPageIdx) {
        idxs.push(nextStackPageIdx);
      }
      if (excludePageIdx !== nextStackPageIdx_2) {
        idxs.push(nextStackPageIdx_2);
      }

      return idxs;
    }

    init();

    (window as any).openPageNoTransition = function (id?: string) {
      const futurePage = id ? document.getElementById(id) : pages[current];
      if (!futurePage) return;
      const futureCurrent = pages.indexOf(futurePage);
      const stackPagesIdxs = getStackPagesIdxs(futureCurrent);

      if (futurePage) {
        futurePage.style.transform = "translate3d(0, 0, 0)";
        futurePage.style.opacity = "1";
        futurePage.classList.remove("page--inactive");
      }

      if (id) {
        current = futureCurrent;
      }

      buildStack();
    };
  }, []);

  return (
    <>
      <nav className="pages-nav">
        <div className="pages-nav__item">
          <Link className="link link--page" href="/">
            About Me
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="/professional-experience">
            Professional Experience
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="/academic-education">
            Academic Education
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="/courses">
            Courses &amp; Certifications
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="/projects">
            Projects
          </Link>
        </div>
        <div className="pages-nav__item">
          <Link className="link link--page" href="/contributing">
            Contributing
          </Link>
        </div>

        <div className="pages-nav__item pages-nav__item--small">
          <Link className="link link--page link--faded" href="/contact">
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
