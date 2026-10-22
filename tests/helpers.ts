import { expect, type Page } from '@playwright/test';

export const sections = [
  'about-me',
  'professional-experience',
  'academic-education',
  'courses',
  'projectsData',
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
  await page.locator('button.menu-button').click();
  await expect(page.locator('.pages-nav')).toHaveClass(/pages-nav--open/);
  await waitForTransitions(page);
}

// Opens a section through the stacked-pages menu and waits for the stack to
// settle, the same way a visitor does.
export async function openSection(page: Page, id: Section) {
  await openMenu(page);
  await page.locator(`.pages-nav a.link--page[href="#${id}"]`).click();
  await expect(page.locator(`#${id}`)).not.toHaveClass(/page--inactive/);
  await expect(page.locator('.pages-stack')).not.toHaveClass(
    /pages-stack--open/,
  );
}

// Scrolls only the section's own container. Element.scrollIntoView would
// also scroll the body, which has overflow: hidden and must stay at the top.
export async function scrollSectionTo(page: Page, selector: string) {
  await page.locator(selector).evaluate((element) => {
    const container = element.closest('.page');
    if (!container) return;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    container.scrollTop +=
      elementRect.top -
      containerRect.top -
      (container.clientHeight - elementRect.height) / 2;
  });
}

export async function openFeedbackForm(page: Page) {
  await page.locator('.bp-nav__item.bp-icon--drop').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}
