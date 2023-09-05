export const loadScript = () => {
  const bodyEl: any = document.body;
  const docElem: HTMLElement = window.document.documentElement;
  const supportsTransitions: boolean =
    "transition" in document.documentElement.style;

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

  // window sizes
  const win = { width: window.innerWidth, height: window.innerHeight };
  // some helper vars to disallow scrolling
  let lockScroll = false,
    xscroll: number,
    yscroll: number,
    scrollContainer: HTMLElement | null = document.querySelector(".container"),
    // the main slider and its items
    sliderEl: HTMLElement | null = document.querySelector(".slider"),
    items: HTMLElement[] = [].slice.call(
      sliderEl?.querySelectorAll(".slide") || []
    ),
    // total number of items
    itemsTotal = items.length,
    // navigation controls/arrows
    navRightCtrl: any | null = sliderEl?.querySelector(".button--nav-next"),
    navLeftCtrl: any | null = sliderEl?.querySelector(".button--nav-prev"),
    zoomCtrl: any | null = sliderEl?.querySelector(".button--zoom"),
    // the main content element
    contentEl: any | null = document.querySelector(".content"),
    // close content control
    closeContentCtrl: any | null = contentEl?.querySelector(
      "button.button--close"
    ),
    // index of current item
    current = 0,
    // check if an item is "open"
    isOpen = false,
    isFirefox = typeof InstallTrigger !== "undefined",
    // scale body when zooming into the items, if not Firefox (the performance in Firefox is not very good)
    bodyScale = isFirefox ? false : 3;

  // some helper functions:
  function scrollX() {
    return window.pageXOffset || docElem.scrollLeft;
  }

  function scrollY() {
    return window.pageYOffset || docElem.scrollTop;
  }

  // from http://www.sberry.me/articles/javascript-event-throttling-debouncing
  function throttle(fn: (e: Event) => void, delay: number) {
    let allowSample = true;

    return function (e: Event) {
      if (allowSample) {
        allowSample = false;
        setTimeout(function () {
          allowSample = true;
        }, delay);
        fn(e);
      }
    };
  }

  function init() {
    initEvents();
  }

  // event binding
  function initEvents() {
    // open items
    if (zoomCtrl) {
      zoomCtrl.addEventListener("click", function () {
        const projetos: HTMLElement | null =
          document.getElementById("projetos");
        if (projetos) {
          projetos.classList.add("noheight");
        }
        openItem(items[current]);
      });
    }

    // close content
    if (closeContentCtrl) {
      closeContentCtrl.addEventListener("click", closeContent);
      closeContentCtrl.addEventListener("click", function () {
        const projetos: HTMLElement | null =
          document.getElementById("projetos");
        if (projetos) {
          projetos.classList.remove("noheight");
        }
      });
    }

    // navigation
    if (navRightCtrl) {
      navRightCtrl.addEventListener("click", function () {
        navigate("right");
      });
    }

    if (navLeftCtrl) {
      navLeftCtrl.addEventListener("click", function () {
        navigate("left");
      });
    }

    // window resize
    window.addEventListener(
      "resize",
      throttle(function (ev) {
        // reset window sizes
        win.width = window.innerWidth;
        win.height = window.innerHeight;

        // reset transforms for the items (slider items)
        items.forEach(function (item, pos) {
          if (pos === current) return;
          var el: any = item.querySelector(".slide__mover");
          dynamics.css(el, { translateX: el.offsetWidth });
        });
      }, 10)
    );

    // keyboard navigation events
    document.addEventListener("keydown", function (ev) {
      if (isOpen) return;
      var keyCode = ev.keyCode || ev.which;
      switch (keyCode) {
        case 37:
          navigate("left");
          break;
        case 39:
          navigate("right");
          break;
      }
    });
  }

  // opens one item
  function openItem(item: HTMLElement) {
    if (isOpen) return;
    isOpen = true;

    // the element that will be transformed
    var zoomer: any = item.querySelector(".zoomer");
    // slide screen preview
    classie.add(zoomer, "zoomer--active");
    // disallow scroll
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", noscroll);
    }
    // apply transforms
    applyTransforms(zoomer);
    // also scale the body so it looks the camera moves to the item.
    if (bodyScale) {
      dynamics.animate(
        bodyEl,
        { scale: bodyScale },
        { type: dynamics.easeInOut, duration: 500 }
      );
    }
    // after the transition is finished:
    onEndTransition(zoomer, function () {
      // reset body transform
      if (bodyScale) {
        dynamics.stop(bodyEl);
        dynamics.css(bodyEl, { scale: 1 });

        // fix for safari (allowing fixed children to keep position)
        bodyEl.style.WebkitTransform = "none";
        bodyEl.style.transform = "none";
      }
      // no scrolling
      classie.add(bodyEl, "noscroll");
      classie.add(contentEl, "content--open");
      var contentItem = document.getElementById(
        item.getAttribute("data-content")
      );
      classie.add(contentItem, "content__item--current");
      classie.add(contentItem, "content__item--reset");

      // reset zoomer transform - back to its original position/transform without a transition
      classie.add(zoomer, "zoomer--notrans");
      zoomer.style.WebkitTransform = "translate3d(0,0,0) scale3d(1,1,1)";
      zoomer.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";
    });
  }

  // closes the item/content
  function closeContent() {
    var contentItem = contentEl?.querySelector(".content__item--current"),
      zoomer = items[current].querySelector(".zoomer");

    if (contentEl) {
      classie.remove(contentEl, "content--open");
    }
    if (contentItem) {
      classie.remove(contentItem, "content__item--current");
    }
    if (bodyEl) {
      classie.remove(bodyEl, "noscroll");
    }

    if (bodyScale) {
      // reset fix for safari (allowing fixed children to keep position)
      if (bodyEl) {
        bodyEl.style.WebkitTransform = "";
        bodyEl.style.transform = "";
      }
    }

    /* fix for safari flickering */
    var nobodyscale = true;
    applyTransforms(zoomer, nobodyscale);
    /* fix for safari flickering */

    // wait for the inner content to finish the transition
    onEndTransition(contentItem, function (ev) {
      classie.remove(this, "content__item--reset");

      // reset scrolling permission
      lockScroll = false;
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", noscroll);
      }

      /* fix for safari flickering */
      zoomer.style.WebkitTransform = "translate3d(0,0,0) scale3d(1,1,1)";
      zoomer.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";
      /* fix for safari flickering */

      // scale up - behind the scenes - the item again (without transition)
      applyTransforms(zoomer);

      // animate/scale down the item
      setTimeout(function () {
        classie.remove(zoomer, "zoomer--notrans");
        classie.remove(zoomer, "zoomer--active");
        zoomer.style.WebkitTransform = "translate3d(0,0,0) scale3d(1,1,1)";
        zoomer.style.transform = "translate3d(0,0,0) scale3d(1,1,1)";
      }, 25);

      if (bodyScale) {
        dynamics.css(bodyEl, { scale: bodyScale });
        dynamics.animate(
          bodyEl,
          { scale: 1 },
          {
            type: dynamics.easeInOut,
            duration: 500,
          }
        );
      }

      isOpen = false;
    });
  }

  // applies the necessary transform value to scale the item up
  function applyTransforms(el: HTMLElement, nobodyscale?: boolean) {
    // zoomer area and scale value
    var zoomerArea = el.querySelector(".zoomer__area"),
      zoomerAreaSize = {
        width: zoomerArea?.offsetWidth || 0,
        height: zoomerArea?.offsetHeight || 0,
      },
      zoomerOffset = zoomerArea?.getBoundingClientRect() || {
        left: 0,
        top: 0,
      },
      scaleVal =
        zoomerAreaSize.width / zoomerAreaSize.height < win.width / win.height
          ? win.width / zoomerAreaSize.width
          : win.height / zoomerAreaSize.height;

    if (bodyScale && !nobodyscale) {
      scaleVal /= bodyScale;
    }

    // apply transform
    el.style.WebkitTransform =
      "translate3d(" +
      Number(win.width / 2 - (zoomerOffset.left + zoomerAreaSize.width / 2)) +
      "px," +
      Number(win.height / 2 - (zoomerOffset.top + zoomerAreaSize.height / 2)) +
      "px,0) scale3d(" +
      scaleVal +
      "," +
      scaleVal +
      ",1)";
    el.style.transform =
      "translate3d(" +
      Number(win.width / 2 - (zoomerOffset.left + zoomerAreaSize.width / 2)) +
      "px," +
      Number(win.height / 2 - (zoomerOffset.top + zoomerAreaSize.height / 2)) +
      "px,0) scale3d(" +
      scaleVal +
      "," +
      scaleVal +
      ",1)";
  }

  // navigate the slider
  function navigate(dir: string) {
    var itemCurrent = items[current],
      currentEl = itemCurrent.querySelector(".slide__mover"),
      currentTitleEl = itemCurrent.querySelector(".slide__title");

    // update new current value
    if (dir === "right") {
      current = current < itemsTotal - 1 ? current + 1 : 0;
    } else {
      current = current > 0 ? current - 1 : itemsTotal - 1;
    }

    var itemNext = items[current],
      nextEl = itemNext.querySelector(".slide__mover"),
      nextTitleEl = itemNext.querySelector(".slide__title");

    // animate the current element out
    dynamics.animate(
      currentEl,
      {
        opacity: 0,
        translateX:
          dir === "right"
            ? (-1 * currentEl.offsetWidth) / 2
            : currentEl.offsetWidth / 2,
        rotateZ: dir === "right" ? -10 : 10,
      },
      {
        type: dynamics.spring,
        duration: 2000,
        friction: 600,
        complete: function () {
          dynamics.css(itemCurrent, { opacity: 0, visibility: "hidden" });
        },
      }
    );

    // animate the current title out
    dynamics.animate(
      currentTitleEl,
      { translateX: dir === "right" ? -250 : 250, opacity: 0 },
      {
        type: dynamics.bezier,
        points: [
          { x: 0, y: 0, cp: [{ x: 0.2, y: 1 }] },
          { x: 1, y: 1, cp: [{ x: 0.3, y: 1 }] },
        ],
        duration: 450,
      }
    );

    // set the right properties for the next element to come in
    dynamics.css(itemNext, { opacity: 1, visibility: "visible" });
    dynamics.css(nextEl, {
      opacity: 0,
      translateX:
        dir === "right"
          ? nextEl.offsetWidth / 2
          : (-1 * nextEl.offsetWidth) / 2,
      rotateZ: dir === "right" ? 10 : -10,
    });

    // animate the next element in
    dynamics.animate(
      nextEl,
      { opacity: 1, translateX: 0 },
      {
        type: dynamics.spring,
        duration: 2000,
        friction: 600,
        complete: function () {
          items.forEach(function (item) {
            classie.remove(item, "slide--current");
          });
          classie.add(itemNext, "slide--current");
        },
      }
    );

    // set the right properties for the next title to come in
    dynamics.css(nextTitleEl, {
      translateX: dir === "right" ? 250 : -250,
      opacity: 0,
    });
    // animate the next title in
    dynamics.animate(
      nextTitleEl,
      { translateX: 0, opacity: 1 },
      {
        type: dynamics.bezier,
        points: [
          { x: 0, y: 0, cp: [{ x: 0.2, y: 1 }] },
          { x: 1, y: 1, cp: [{ x: 0.3, y: 1 }] },
        ],
        duration: 650,
      }
    );
  }

  // disallow scrolling (on the scrollContainer)
  function noscroll() {
    if (!lockScroll) {
      lockScroll = true;
      xscroll = scrollContainer?.scrollLeft || 0;
      yscroll = scrollContainer?.scrollTop || 0;
    }
    if (scrollContainer) {
      scrollContainer.scrollTop = yscroll;
      scrollContainer.scrollLeft = xscroll;
    }
  }

  init();
};
