export const loadScript = () => {
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
};
