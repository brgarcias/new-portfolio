import { expect, test, type Page } from '@playwright/test';
import {
  openFeedbackForm,
  openMenu,
  openSection,
  scrollSectionTo,
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
    page.locator(
      '#professional-experience .cbp_tmtimeline > li:first-child .cbp_tmtime > span:first-child',
    ),
    page.locator('#contact label[for="tab-1"] .tab_right p').last(),
  ];
}

async function expectScreenshot(page: Page, name: string, scope = 'body') {
  await settle(page, scope);
  await expect(page).toHaveScreenshot(name, { mask: timeDependent(page) });
}

test('página inicial', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await expectScreenshot(page, 'about-me.png', '#about-me');
});

test('menu aberto', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await openMenu(page);
  await expectScreenshot(page, 'menu.png');
});

for (const id of sections.slice(1) as Section[]) {
  test(`seção ${id}`, { tag: '@visual' }, async ({ page }) => {
    await page.goto('/');
    await openSection(page, id);
    await expectScreenshot(page, `${id}.png`, `#${id}`);
  });
}

test('experiência expandida', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'professional-experience');
  const second = page.locator(
    '#professional-experience .cbp_tmtimeline > li:nth-child(2)',
  );
  await second.locator('.experience-header').click();
  await scrollSectionTo(
    page,
    '#professional-experience .cbp_tmtimeline > li:nth-child(2)',
  );
  await expectScreenshot(
    page,
    'professional-experience-expanded.png',
    '#professional-experience',
  );
});

test('etapa da formação', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'academic-education');
  await scrollSectionTo(page, '#academic-education .progress');
  await page.locator('#academic-education label[for="step-3"]').click();
  await expectScreenshot(
    page,
    'academic-education-university.png',
    '#academic-education',
  );
});

test('detalhes de um curso', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'courses');
  await scrollSectionTo(page, '#rb-grid > li:first-child');
  await page.locator('#rb-grid > li').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectScreenshot(page, 'course-details.png');
});

test('slider e detalhes de projeto', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'projectsData');
  await scrollSectionTo(page, '#projectsData .slider');
  await page.getByRole('button', { name: 'Next Project' }).click();
  await page.getByRole('button', { name: 'Next Project' }).click();
  await expectScreenshot(page, 'projects-slider.png', '#projectsData');
  await page.getByRole('button', { name: 'See Details' }).click();
  await expect(page.locator('#content-3')).toHaveClass(
    /content__item--current/,
  );
  await expectScreenshot(page, 'project-details.png', '#projectsData');
});

test('galeria de contribuições', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'contributing');
  await scrollSectionTo(page, '#contributing .contrib-grid');
  await expect(page.locator('#contributing .contrib-gallery')).toHaveClass(
    /is-visible/,
  );
  await expectScreenshot(page, 'contributing-gallery.png', '#contributing');
});

test('aba de contato', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'contact');
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

test('página 404', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/pagina-inexistente');
  await expectScreenshot(page, 'not-found.png');
});
