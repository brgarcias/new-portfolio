import { expect, test, type Page } from '@playwright/test';
import {
  openFeedbackForm,
  openMenu,
  scrollTo,
  sections,
  waitForProjectsTrack,
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
    page
      .locator('#contact .contact-card--profile .contact-card__details li')
      .last(),
    page.locator('.site-footer__year'),
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
  // The click waits for the card to finish entering, and the centring below
  // for the details to finish opening. Otherwise the capture moved around.
  await expect(page.locator(`${second} .xp-card`)).toHaveCSS('opacity', '1');
  await page.locator(`${second} .xp-card__toggle`).click();
  await waitForTransitions(page);
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
  await scrollTo(page, '#courses .course-card:first-child');
  // Like the other captures that click, it waits for the cards to finish
  // entering, so the page behind the dialog is always in the same place.
  await expect(page.locator('#courses .course-grid-wrap')).toHaveCSS(
    'opacity',
    '1',
  );
  await page
    .locator('#courses .course-card')
    .first()
    .getByRole('button')
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectScreenshot(page, 'course-details.png');
});

test('slider e detalhes de projeto', { tag: '@visual' }, async ({ page }) => {
  // With reduced motion the arrows jump straight to the card. After a
  // glide, the previews inside the devices did not always come out the
  // same, by a pixel or two.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await scrollTo(page, '#projects .projects__track');
  // As with the education steps, a click while the cards finish entering
  // sometimes scrolled the page first, which moved the whole capture.
  await expect(page.locator('#projects .projects')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: 'Next Project' }).click();
  await page.getByRole('button', { name: 'Next Project' }).click();
  await expect(
    page.locator('#projects [aria-current="true"] .project-card__title'),
  ).toHaveText('Reparofone');
  await waitForProjectsTrack(page);
  await expectScreenshot(page, 'projects-slider.png', '#projects');
  await page
    .getByRole('button', { name: 'See details about Reparofone' })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectScreenshot(page, 'project-details.png', '[role="dialog"]');
});

test('galeria de contribuições', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await scrollTo(page, '#contributing .contrib-grid');
  await expect(page.locator('#contributing .contrib__grid')).toHaveCSS(
    'opacity',
    '1',
  );
  await expectScreenshot(page, 'contributing-gallery.png', '#contributing');
});

test('visualizador de fotos', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await scrollTo(page, '#contributing .contrib-grid');
  await expect(page.locator('#contributing .contrib__grid')).toHaveCSS(
    'opacity',
    '1',
  );
  await page.locator('#contributing .contrib-card__button').nth(1).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectScreenshot(page, 'photo-viewer.png', '[role="dialog"]');
});

test('cartões de contato', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await scrollTo(page, '#contact .contact-grid');
  await expect(page.locator('#contact .contact')).toHaveCSS('opacity', '1');
  await expectScreenshot(page, 'contact-cards.png', '#contact');
});

test('rodapé', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  );
  await expect(page.locator('#contact .contact')).toHaveCSS('opacity', '1');
  await expectScreenshot(page, 'footer.png', '.site-footer');
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
  // A browser without IntersectionObserver breaks the sections that enter as
  // they scroll into view.
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
