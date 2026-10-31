import { expect, type Page } from '@playwright/test';

export const sections = [
  'about',
  'experience',
  'education',
  'courses',
  'projects',
  'contributing',
  'contact',
] as const;

export type Section = (typeof sections)[number];

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
  await openSection(page, 'contact');
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
