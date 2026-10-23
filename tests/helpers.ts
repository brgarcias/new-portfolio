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
  await page.getByRole('button', { name: 'Leave Feedback' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}
