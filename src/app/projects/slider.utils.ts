export const loadScript = () => {
  const bodyEl = document.body;

  const supportsTransitions = "transition" in document.documentElement.style;

  const win = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  let lockScroll = false;
  let xscroll = 0;
  let yscroll = 0;

  const scrollContainer = document.querySelector(
    ".container",
  ) as HTMLElement | null;

  const sliderEl = document.querySelector(".slider") as HTMLElement | null;

  if (!sliderEl) return;

  const items = Array.from(
    sliderEl.querySelectorAll(".slide"),
  ) as HTMLElement[];

  const itemsTotal = items.length;

  const navRightCtrl = sliderEl.querySelector(
    ".button--nav-next",
  ) as HTMLButtonElement | null;

  const navLeftCtrl = sliderEl.querySelector(
    ".button--nav-prev",
  ) as HTMLButtonElement | null;

  const zoomCtrl = sliderEl.querySelector(
    ".button--zoom",
  ) as HTMLButtonElement | null;

  const contentEl = document.querySelector(".content") as HTMLElement | null;

  const closeContentCtrl = contentEl?.querySelector(
    ".button--close",
  ) as HTMLButtonElement | null;

  let current = 0;
  let isOpen = false;
  let isAnimating = false;

  const isMobile = () => window.innerWidth <= 768;

  function onEndTransition(el: HTMLElement, callback: () => void) {
    const handler = (ev: TransitionEvent) => {
      if (ev.target !== el) return;

      el.removeEventListener("transitionend", handler);
      callback();
    };

    if (supportsTransitions) {
      el.addEventListener("transitionend", handler);
    } else {
      callback();
    }
  }

  function throttle<T extends (...args: never[]) => void>(fn: T, wait: number) {
    let waiting = false;

    return (...args: Parameters<T>) => {
      if (waiting) return;

      fn(...args);
      waiting = true;

      setTimeout(() => {
        waiting = false;
      }, wait);
    };
  }

  function updateSlider() {
    items.forEach((item, index) => {
      item.classList.toggle("slide--current", index === current);
    });
  }

  function navigate(direction: "left" | "right") {
    if (isOpen || isAnimating) return;

    isAnimating = true;

    current =
      direction === "right"
        ? current < itemsTotal - 1
          ? current + 1
          : 0
        : current > 0
          ? current - 1
          : itemsTotal - 1;

    updateSlider();

    setTimeout(() => {
      isAnimating = false;
    }, 500);
  }

  function applyTransforms(el: HTMLElement, nobodyscale = false) {
    const zoomerArea = el.querySelector(".zoomer__area") as HTMLElement | null;

    if (!zoomerArea) return;

    if (isMobile()) {
      el.style.transform = "translate3d(0,0,0) scale3d(1.05,1.05,1)";
      return;
    }

    const areaRect = zoomerArea.getBoundingClientRect();

    const scaleVal =
      areaRect.width / areaRect.height < win.width / win.height
        ? win.width / areaRect.width
        : win.height / areaRect.height;

    const finalScale = nobodyscale ? scaleVal : scaleVal / 3;

    const tx = win.width / 2 - (areaRect.left + areaRect.width / 2);

    const ty = win.height / 2 - (areaRect.top + areaRect.height / 2);

    el.style.transform = `
      translate3d(${tx}px, ${ty}px, 0)
      scale3d(${finalScale}, ${finalScale}, 1)
    `;
  }

  function openItem(item: HTMLElement) {
    if (isOpen || isAnimating) return;

    const zoomer = item.querySelector(".zoomer") as HTMLElement | null;

    if (!zoomer || !contentEl) return;

    isOpen = true;
    isAnimating = true;

    zoomer.classList.add("zoomer--active");

    scrollContainer?.addEventListener("scroll", noscroll, { passive: false });

    applyTransforms(zoomer);

    onEndTransition(zoomer, () => {
      bodyEl.classList.add("noscroll");

      contentEl.classList.add("content--open");

      const contentId = item.dataset.content;

      if (!contentId) return;

      const contentItem = document.getElementById(contentId);

      if (!contentItem) return;

      contentItem.classList.add("content__item--current");

      requestAnimationFrame(() => {
        contentItem.classList.add("content__item--reset");
      });

      zoomer.classList.add("zoomer--notrans");

      zoomer.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";

      isAnimating = false;
    });
  }

  function closeContent() {
    if (isAnimating) return;

    isAnimating = true;

    const contentItem = contentEl?.querySelector(
      ".content__item--current",
    ) as HTMLElement | null;

    const zoomer = items[current].querySelector(
      ".zoomer",
    ) as HTMLElement | null;

    contentEl?.classList.remove("content--open");

    contentItem?.classList.remove("content__item--current");

    bodyEl.classList.remove("noscroll");

    if (!contentItem || !zoomer) {
      isAnimating = false;
      isOpen = false;
      return;
    }

    applyTransforms(zoomer, true);

    onEndTransition(contentItem, () => {
      lockScroll = false;

      scrollContainer?.removeEventListener("scroll", noscroll);

      zoomer.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";

      applyTransforms(zoomer);

      setTimeout(() => {
        zoomer.classList.remove("zoomer--notrans");
        zoomer.classList.remove("zoomer--active");

        zoomer.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";

        isAnimating = false;
        isOpen = false;
      }, 25);
    });
  }

  function noscroll() {
    if (!scrollContainer) return;

    if (!lockScroll) {
      lockScroll = true;

      xscroll = scrollContainer.scrollLeft;
      yscroll = scrollContainer.scrollTop;
    }

    scrollContainer.scrollTo(xscroll, yscroll);
  }

  function initEvents() {
    zoomCtrl?.addEventListener("click", () => {
      openItem(items[current]);
    });

    closeContentCtrl?.addEventListener("click", closeContent);

    navRightCtrl?.addEventListener("click", () => {
      navigate("right");
    });

    navLeftCtrl?.addEventListener("click", () => {
      navigate("left");
    });

    window.addEventListener(
      "resize",
      throttle(() => {
        win.width = window.innerWidth;
        win.height = window.innerHeight;
      }, 100),
    );

    window.addEventListener("keydown", (ev) => {
      if (isOpen) return;

      if (ev.key === "ArrowLeft") {
        navigate("left");
      }

      if (ev.key === "ArrowRight") {
        navigate("right");
      }

      if (ev.key === "Escape" && isOpen) {
        closeContent();
      }
    });
  }

  updateSlider();
  initEvents();
};
