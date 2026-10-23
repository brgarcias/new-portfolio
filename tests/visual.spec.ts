import { expect, test, type Page } from '@playwright/test';
import {
  openFeedbackForm,
  openMenu,
  scrollTo,
  sections,
  waitForTransitions,
  type Section,
} from './helpers';

// These screenshots are the contract for how the site looks. They are
// recorded in the Playwright Linux container that CI uses, because font
// rendering differs between operating systems.
test.skip(
  process.platform !== 'linux',
  'Visual snapshots are recorded and compared in the Linux container used by CI.',
);

test.describe.configure({ mode: 'parallel' });

// A failed comparison already saves the actual and diff images, and traces
// of these pages would carry every photo of the contributing section.
test.use({ trace: 'off' });

async function settle(page: Page, scope = 'body') {
  await page.evaluate(() => document.fonts.ready);
  await page.locator(`${scope} img`).evaluateAll((images) =>
    Promise.all(
      (images as HTMLImageElement[]).map((image) => {
        image.loading = 'eager';
        return image.decode().catch(() => undefined);
      }),
    ),
  );
  await waitForTransitions(page);
  await page.mouse.move(0, 0);
}

// Values computed from today's date change over time, so they are masked.
function timeDependent(page: Page) {
  return [
    page.locator('#experience .xp-item:first-child .xp-item__duration'),
    // The age only shows while its tab is open. Collapsed, its box overlaps
    // the open tab.
    page.locator('#contact #tab-1:checked + label .tab_right p').last(),
  ];
}

async function expectScreenshot(page: Page, name: string, scope = 'body') {
  await settle(page, scope);
  await expect(page).toHaveScreenshot(name, { mask: timeDependent(page) });
}

// Scrolls a section to the top, under the fixed header, and waits for its
// header to finish entering.
async function goToSection(page: Page, id: Section) {
  await page.evaluate((sectionId) => {
    const section = document.getElementById(sectionId)!;
    const header = document.querySelector<HTMLElement>('.site-header')!;
    window.scrollTo({
      top: section.offsetTop - header.offsetHeight,
      behavior: 'instant',
    });
  }, id);
  await expect(page.locator(`#${id} .section__header`)).toHaveCSS(
    'opacity',
    '1',
  );
}

test('topo da página', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await expectScreenshot(page, 'hero.png', '#top');
});

test('menu aberto', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await goToSection(page, 'experience');
  await openMenu(page);
  await expectScreenshot(page, 'menu.png');
});

for (const id of sections) {
  test(`seção ${id}`, { tag: '@visual' }, async ({ page }) => {
    await page.goto('/');
    await goToSection(page, id);
    await expectScreenshot(page, `${id}.png`, `#${id}`);
  });
}

test('experiência expandida', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  const second = '#experience .xp-item:nth-child(2)';
  await scrollTo(page, second);
  await page.locator(`${second} .xp-card__toggle`).click();
  await scrollTo(page, second);
  await expectScreenshot(page, 'experience-expanded.png', '#experience');
});

test('etapa da formação', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await scrollTo(page, '#education .edu');
  // A click as the steps finished entering sometimes scrolled the page
  // before clicking, which moved the steps to the bottom of the screen.
  await expect(page.locator('#education .edu-wrap')).toHaveCSS('opacity', '1');
  await page
    .locator('#education')
    .getByRole('tab', { name: 'University Education' })
    .click();
  await expectScreenshot(page, 'education-university.png', '#education');
});

test('faixa de tecnologias', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await scrollTo(page, '#experience .tech-ribbon');
  await expectScreenshot(page, 'tech-ribbon.png', '#experience');
});

test('detalhes de um curso', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await scrollTo(page, '#rb-grid > li:first-child');
  await page.locator('#rb-grid > li').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectScreenshot(page, 'course-details.png');
});

test('slider e detalhes de projeto', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await scrollTo(page, '#projects .slider');
  await page.getByRole('button', { name: 'Next Project' }).click();
  await page.getByRole('button', { name: 'Next Project' }).click();
  await expectScreenshot(page, 'projects-slider.png', '#projects');
  await page.getByRole('button', { name: 'See Details' }).click();
  await expect(page.locator('#content-3')).toHaveClass(
    /content__item--current/,
  );
  await expectScreenshot(page, 'project-details.png', '#projects');
});

test('galeria de contribuições', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await scrollTo(page, '#contributing .contrib-grid');
  await expect(page.locator('#contributing .contrib-gallery')).toHaveClass(
    /is-visible/,
  );
  await expectScreenshot(page, 'contributing-gallery.png', '#contributing');
});

test('aba de contato', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await goToSection(page, 'contact');
  await page.locator('#contact label[for="tab-3"]').click();
  await expectScreenshot(page, 'contact-email.png', '#contact');
});

test(
  'erros do formulário de feedback',
  { tag: '@visual' },
  async ({ page }) => {
    await page.goto('/');
    const dialog = await openFeedbackForm(page);
    await dialog.getByRole('button', { name: 'Send' }).click();
    await expect(dialog.getByText('Please, write your name.')).toBeVisible();
    await expectScreenshot(page, 'feedback-errors.png');
  },
);

test('aviso de feedback enviado', { tag: '@visual' }, async ({ page }) => {
  await page.route('**/*', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 200, body: '' })
      : route.continue(),
  );
  await page.goto('/');
  const dialog = await openFeedbackForm(page);
  await dialog.locator('input[name="fullName"]').fill('Visitante de Teste');
  await dialog.locator('input[name="email"]').fill('visitante@example.com');
  await dialog.locator('textarea[name="feedback"]').fill('Gostei muito.');
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Message Submitted')).toBeVisible();
  await expectScreenshot(page, 'feedback-sent.png');
});

test('página de erro', { tag: '@visual' }, async ({ page }) => {
  // A browser without IntersectionObserver breaks the contributing section.
  await page.addInitScript(() =>
    Reflect.deleteProperty(window, 'IntersectionObserver'),
  );
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Something Went Wrong' }),
  ).toBeVisible();
  await expectScreenshot(page, 'error.png');
});

test('página 404', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/pagina-inexistente');
  await expectScreenshot(page, 'not-found.png');
});
