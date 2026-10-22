import { expect, test, type Page } from '@playwright/test';
import {
  openFeedbackForm,
  openMenu,
  openSection,
  scrollSectionTo,
  sections,
} from './helpers';

async function fillFeedback(page: Page) {
  const dialog = await openFeedbackForm(page);
  await dialog.locator('input[name="fullName"]').fill('Visitante de Teste');
  await dialog.locator('input[name="email"]').fill('visitante@example.com');
  await dialog
    .locator('textarea[name="feedback"]')
    .fill('Gostei muito do portfólio.');
  return dialog;
}

test('carrega o portfólio sem erros e sem rolagem horizontal', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Bruno Garcia — Dev. Full-Stack');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.locator('meta[name="google-site-verification"]'),
  ).toHaveAttribute('content', 'zE-A_JWezHcTY0RPEAiraoj-ORR540i46tyJwSk0T3s');
  await expect(page.locator('#about-me h1')).toHaveText('Full-Stack Developer');
  await expect(page.locator('.pages-stack > .page')).toHaveCount(
    sections.length,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('navega por todas as seções pelo menu e fecha o menu com Escape', async ({
  page,
}) => {
  await page.goto('/');
  for (const id of [...sections.slice(1), sections[0]]) {
    await openSection(page, id);
  }
  await openMenu(page);
  await expect(page.locator('button.menu-button')).toHaveClass(
    /menu-button--open/,
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('button.menu-button')).not.toHaveClass(
    /menu-button--open/,
  );
  await expect(page.locator('.pages-stack')).not.toHaveClass(
    /pages-stack--open/,
  );
  await expect(page.locator('#about-me')).not.toHaveClass(/page--inactive/);
});

test('abre e recolhe as experiências profissionais', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'professional-experience');
  const items = page.locator('#professional-experience .cbp_tmtimeline > li');
  await expect(items).toHaveCount(8);
  await expect(items.first().locator('h2')).toHaveText(
    'Software Engineer (Node.js / GraphQL Platform)',
  );
  await expect(items.first().locator('.experience-body')).toHaveClass(
    /\bopen\b/,
  );
  const second = items.nth(1);
  await expect(second.locator('.experience-body')).not.toHaveClass(/\bopen\b/);
  await second.locator('.experience-header').click();
  await expect(second.locator('.experience-body')).toHaveClass(/\bopen\b/);
  await expect(second.getByText('Microsoft SQL Server')).toBeVisible();
  await second.locator('.experience-header').click();
  await expect(second.locator('.experience-body')).not.toHaveClass(/\bopen\b/);
});

test('alterna as etapas da formação acadêmica', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'academic-education');
  const tabs = page.locator('#academic-education .progress_inner__tabs .tab');
  await expect(tabs).toHaveCount(5);
  await expect(tabs.first()).toBeVisible();
  await scrollSectionTo(page, '#academic-education .progress');
  await page.locator('#academic-education label[for="step-3"]').click();
  await expect(page.locator('#step-3')).toBeChecked();
  await expect(tabs.nth(2)).toBeVisible();
  await expect(tabs.nth(2).locator('h1')).toHaveText(
    'Universidade São Judas Tadeu',
  );
  await expect(tabs.first()).toBeHidden();
});

test('mostra os detalhes de um curso em um modal', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'courses');
  await expect(page.locator('#rb-grid > li')).toHaveCount(6);
  await page.locator('#rb-grid > li').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Full-Stack Developer - IGTI')).toBeVisible();
  await expect(dialog.getByText('Second Module - Node.js')).toBeVisible();
  await dialog.locator('footer').getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();

  await page.locator('#rb-grid > li').last().click();
  await expect(dialog.getByText('Advanced Physics')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('navega pelos projetos e abre os detalhes', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'projectsData');
  const title = page.locator('#projectsData .slide--current .slide__title');
  await expect(title).toContainText('CSS');
  await page.getByRole('button', { name: 'Next Project' }).click();
  await expect(title).toContainText('Sensei');
  await page.getByRole('button', { name: 'Previous Project' }).click();
  await expect(title).toContainText('CSS');
  await page.getByRole('button', { name: 'Previous Project' }).click();
  await expect(title).toContainText('Malka RH');

  await page.getByRole('button', { name: 'See Details' }).click();
  const content = page.locator('#projectsData .content');
  await expect(content).toHaveClass(/content--open/);
  const detail = page.locator('#content-5');
  await expect(detail).toHaveClass(/content__item--current/);
  await expect(detail.locator('h2')).toHaveText('Malka RH');
  const link = detail.getByRole('link', { name: /See more about the website/ });
  await expect(link).toHaveAttribute(
    'href',
    'http://malkarh.com.br/lp/recrutamento-e-selecao/',
  );
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

  await page.getByRole('button', { name: 'Close content' }).click();
  await expect(content).not.toHaveClass(/content--open/);
  await expect(detail).not.toHaveClass(/content__item--current/);
  // The slider ignores navigation until the zoom-out animation ends.
  await expect(
    page.locator('#projectsData .slide--current .zoomer'),
  ).not.toHaveClass(/zoomer--active/);
  await page.getByRole('button', { name: 'Next Project' }).click();
  await expect(title).toContainText('CSS');
});

test('destaca as iniciativas de contribuição', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'contributing');
  const cards = page.locator('#contributing .c-card');
  await expect(cards).toHaveCount(4);
  await scrollSectionTo(page, '#contributing .contrib-grid');
  await expect(page.locator('#contributing .contrib-gallery')).toHaveClass(
    /is-visible/,
  );
  await cards.first().hover();
  await expect(cards.first()).toHaveClass(/c-card--active/);
  await expect(cards.first().locator('.c-card__overlay-title')).toHaveText(
    'Easter donation campaigns',
  );
});

test('alterna as abas de contato', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'contact');
  await expect(page.locator('#tab-1')).toBeChecked();
  await page.locator('#contact label[for="tab-3"]').click();
  await expect(page.locator('#tab-3')).toBeChecked();
  await expect(page.locator('#contact label[for="tab-3"]')).toContainText(
    'bruno-151299@hotmail.com',
  );
});

test('oferece o currículo e os canais de contato', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.bp-nav__item.bp-icon--archive').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Bruno_Garcia_Resume.zip');
  const response = await request.get('/documents/cv/Bruno_Garcia_Resume.zip');
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 2).toString()).toBe('PK');

  const social = page.locator('.pages-nav__item--social a');
  await expect(social).toHaveCount(4);
  await expect(social.nth(0)).toHaveAttribute(
    'href',
    'mailto:bruno-151299@hotmail.com',
  );
  await expect(social.nth(1)).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/bruno-garcia-9854b1161/',
  );
  await expect(social.nth(2)).toHaveAttribute(
    'href',
    /^https:\/\/api\.whatsapp\.com\/send\?phone=5511996969301/,
  );
  await expect(social.nth(3)).toHaveAttribute(
    'href',
    'https://github.com/brgarcias',
  );
});

test('valida os campos do formulário de feedback', async ({ page }) => {
  await page.goto('/');
  const dialog = await openFeedbackForm(page);
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(dialog.getByText('Please, write your name.')).toBeVisible();
  await expect(dialog.getByText('Please, tell me your email.')).toBeVisible();
  await expect(
    dialog.getByText('Please, give me your feedback.'),
  ).toBeVisible();

  await dialog.locator('input[name="email"]').fill('email-invalido');
  await expect(dialog.getByText('Please, tell me your email.')).toBeVisible();
  await dialog.locator('input[name="email"]').fill('visitante@example.com');
  await expect(dialog.getByText('Please, tell me your email.')).toBeHidden();

  await dialog.getByRole('button', { name: 'Close' }).last().click();
  await expect(dialog).toBeHidden();
});

test('envia o feedback e confirma o envio', async ({ page }) => {
  let payload: URLSearchParams | undefined;
  await page.route('**/*', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    payload = new URLSearchParams(route.request().postData() ?? '');
    await route.fulfill({ status: 200, body: '' });
  });
  await page.goto('/');
  const dialog = await fillFeedback(page);
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Message Submitted')).toBeVisible();
  await expect(
    page.getByText('Thank you very much for your feedback!'),
  ).toBeVisible();
  expect(payload?.get('fullName')).toBe('Visitante de Teste');
  expect(payload?.get('email')).toBe('visitante@example.com');
  expect(payload?.get('feedback')).toBe('Gostei muito do portfólio.');

  await page.keyboard.press('Escape');
  await expect(page.getByText('Message Submitted')).toBeHidden();
});

test('avisa quando o envio do feedback falha', async ({ page }) => {
  await page.route('**/*', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 500, body: '' })
      : route.continue(),
  );
  await page.goto('/');
  const dialog = await fillFeedback(page);
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('We had a problem')).toBeVisible();
  await expect(
    page.getByText('An error occurred while sending your message!'),
  ).toBeVisible();
});

test('mostra a página 404', async ({ page }) => {
  const response = await page.goto('/pagina-inexistente');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Not Found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return Home' })).toHaveAttribute(
    'href',
    '/',
  );
});
