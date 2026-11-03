import { expect, type Page } from '@playwright/test';

export const sections = [
  'projects',
  'expertise',
  'experience',
  'about',
  'education',
  'courses',
  'contributing',
  'contact',
] as const;

export type Section = (typeof sections)[number];

// How far the page runs past the screen. Measured against clientWidth, and not
// window.innerWidth: on a phone, or in Playwright's emulation of one, the browser
// zooms out to fit what is too wide, innerWidth grows with it, and a page with a
// 1200 px block on a 390 px screen looked fine.
export const pageOverflow = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

// The texts that run past their box: wider than it, or making it wider than
// what holds it, as a long word in a card's button does, which then gets cut
// off or covers the next one with no scroll to show for it.
export const findSpills = (page: Page, root = 'body', allowed = 'svg') =>
  page.evaluate(
    ([root, allowed]) => {
      const past = (element: HTMLElement) => {
        const parent = element.parentElement;
        if (!parent) return false;
        const parentStyle = getComputedStyle(parent);
        // What scrolls sideways, like the carousels, runs past on purpose.
        if (['auto', 'scroll'].includes(parentStyle.overflowX)) return false;
        const box = element.getBoundingClientRect();
        const holder = parent.getBoundingClientRect();
        return box.right > holder.right + 2 || box.left < holder.left - 2;
      };
      return [...document.querySelectorAll<HTMLElement>(`${root} *`)]
        .filter((element) => {
          if (
            element.closest(
              `svg, [aria-hidden="true"], .visually-hidden, ${allowed}`,
            )
          ) {
            return false;
          }
          const style = getComputedStyle(element);
          if (
            ['none', 'contents'].includes(style.display) ||
            style.position === 'absolute' ||
            style.position === 'fixed' ||
            style.overflowX !== 'visible' ||
            style.textOverflow === 'ellipsis'
          ) {
            return false;
          }
          const hasText = [...element.childNodes].some(
            (node) =>
              node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          );
          if (!hasText || element.getClientRects().length === 0) return false;
          const wider =
            style.display !== 'inline' &&
            element.clientWidth > 0 &&
            element.scrollWidth - element.clientWidth > 2;
          return wider || past(element);
        })
        .map(
          (element) =>
            `${element.tagName.toLowerCase()}.${element.className} "${element.textContent?.trim().slice(0, 30)}"`,
        );
    },
    [root, allowed],
  );

// The stacked-pages menu is driven by CSS transitions, so interactions wait
// for them to finish like a visitor would.
export async function waitForTransitions(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          !(animation instanceof CSSTransition) ||
          animation.playState !== 'running',
      ),
  );
}

export async function openMenu(page: Page) {
  await page.locator('.menu-toggle').click();
  await expect(page.locator('.stack-menu')).toHaveClass(/stack-menu--open/);
  await waitForTransitions(page);
}

export async function expectMenuClosed(page: Page) {
  await expect(page.locator('.stage')).not.toHaveClass(/stage--locked/);
  await expect(page.locator('.menu-toggle')).toHaveAttribute(
    'aria-expanded',
    'false',
  );
}

// Opens a section through the stacked-pages menu, the way a visitor does on
// any screen size, and waits for it to settle under the fixed header.
export async function openSection(page: Page, id: Section) {
  await openMenu(page);
  await page.locator(`.stack-menu__link[href="#${id}"]`).click();
  await expectMenuClosed(page);
  // The section starts right under the header, unless the page ends first.
  await expect
    .poll(() =>
      page.evaluate((sectionId) => {
        const top =
          document.getElementById(sectionId)!.getBoundingClientRect().top -
          document.querySelector<HTMLElement>('.site-header')!.offsetHeight;
        const atBottom =
          Math.ceil(window.scrollY + window.innerHeight) >=
          document.documentElement.scrollHeight;
        return Math.round(top) === 0 || (top > 0 && atBottom);
      }, id),
    )
    .toBe(true);
}

// The projects track glides to the card chosen with the arrows. Like a
// visitor, the tests wait for it to arrive before using the card: a click
// while it moves would scroll the track and stop it halfway.
export async function waitForProjectsTrack(page: Page) {
  await page.waitForFunction(() => {
    const track = document.querySelector('#projects .projects__track')!;
    const first = track.firstElementChild as HTMLElement;
    const card = track.querySelector<HTMLElement>('[aria-current="true"]')!;
    return (
      Math.abs(track.scrollLeft - (card.offsetLeft - first.offsetLeft)) < 1
    );
  });
}

// Scrolls the page so an element sits in the middle of the screen.
export async function scrollTo(page: Page, selector: string) {
  await page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    window.scrollBy({
      top: rect.top - (window.innerHeight - rect.height) / 2,
      behavior: 'instant',
    });
  });
}

export async function openFeedbackForm(page: Page) {
  // The button closes the contact section. A click while the section entered
  // sometimes missed, and Playwright scrolled the page to try again, which
  // left it somewhere else behind the dialog in the captures.
  await scrollTo(page, '#contact .contact__feedback');
  await expect(page.locator('#contact .contact')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: 'Leave feedback' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

// Counts the view transitions the page starts, as the theme button does to
// spread the new theme from it.
export async function countViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const start = document.startViewTransition?.bind(document);
    Object.assign(window, { viewTransitions: 0 });
    if (!start) return;
    document.startViewTransition = ((update) => {
      Object.assign(window, {
        viewTransitions:
          (window as unknown as { viewTransitions: number }).viewTransitions +
          1,
      });
      return start(update);
    }) as typeof document.startViewTransition;
  });
  return () =>
    page.evaluate(
      () => (window as unknown as { viewTransitions: number }).viewTransitions,
    );
}
