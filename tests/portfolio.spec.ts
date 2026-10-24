import { expect, test, type Page } from '@playwright/test';
import {
  countViewTransitions,
  expectMenuClosed,
  openFeedbackForm,
  openMenu,
  openSection,
  scrollTo,
  sections,
  waitForProjectsTrack,
  waitForTransitions,
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
  // Regenerated daily, so the durations and the age stay current.
  expect(response?.headers()['cache-control']).toContain('s-maxage=86400');
  await expect(page).toHaveTitle('Bruno Garcia — Dev. Full-Stack');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.locator('meta[name="google-site-verification"]'),
  ).toHaveAttribute('content', 'zE-A_JWezHcTY0RPEAiraoj-ORR540i46tyJwSk0T3s');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Full-Stack Developer',
  );
  await expect(page.locator('#top .hero__status')).toHaveText(
    'Currently Software Engineer at PayPal',
  );
  for (const id of sections) {
    await expect(page.locator(`main > section#${id}`)).toHaveCount(1);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('mostra o inglês em / e leva quem abre /en para /', async ({
  request,
}) => {
  const response = await request.get('/en', { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(
    new URL(response.headers()['location'], 'http://localhost').pathname,
  ).toBe('/');
  // Addresses outside the languages have no page.
  expect((await request.get('/en/anything')).status()).toBe(404);
});

test('mostra o site em português e em espanhol', async ({ page }) => {
  const siteUrl = 'https://brgarcias-portfolio.netlify.app';
  await page.goto('/pt');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Desenvolvedor Full-Stack',
  );
  await expect(page.locator('#top .hero__status')).toHaveText(
    'Atualmente Engenheiro de Software na PayPal',
  );
  await expect(page.locator('#experience h2')).toHaveText(
    'Experiência profissional',
  );
  // Months and the current role in the page's language.
  await expect(
    page.locator('#experience .xp-item').first().locator('.xp-item__period'),
  ).toContainText('out. de 2025 — Atual');
  await expect(
    page.locator('#contact .contact-card--profile .contact-card__details li'),
  ).toContainText([/^Casado$/, /^\d+ anos$/]);
  // The other languages are linked for search engines.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${siteUrl}/pt`,
  );
  for (const [lang, path] of [
    ['en', ''],
    ['pt', '/pt'],
    ['es', '/es'],
    ['x-default', ''],
  ]) {
    await expect(
      page.locator(`link[rel="alternate"][hreflang="${lang}"]`),
    ).toHaveAttribute('href', `${siteUrl}${path}`);
  }

  await page.goto('/es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Desarrollador Full-Stack',
  );
  await expect(page.locator('#contact h2')).toHaveText('Contacto');
});

test('troca o idioma e mantém a seção na tela', async ({ page, isMobile }) => {
  await page.goto('/');
  await openSection(page, 'projects');
  if (isMobile) {
    // On phones the languages are in the menu.
    await openMenu(page);
    await page
      .locator('.stack-menu')
      .getByRole('link', { name: 'Português' })
      .click();
  } else {
    await page.getByRole('button', { name: 'Language: English' }).click();
    const option = page
      .locator('.site-header')
      .getByRole('link', { name: 'Português' });
    await expect(option).toHaveAttribute('href', '/pt#projects');
    await option.click();
  }
  await expect(page).toHaveURL('/pt#projects');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
  await expect(page.locator('#projects h2')).toHaveText('Meus projetos');
  await expect(page.locator('#projects h2')).toBeInViewport();
});

test('navega por todas as seções pelo menu e fecha o menu com Escape', async ({
  page,
}) => {
  // Seven trips through the animated menu take most of the default timeout.
  test.slow();
  await page.goto('/');
  for (const id of [...sections.slice(1), sections[0]]) {
    await openSection(page, id);
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
  }
  const scrollY = await page.evaluate(() => window.scrollY);
  await openMenu(page);
  await expect(page.locator('.menu-toggle')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await expect(page.locator('.stage')).toHaveClass(/stage--open/);
  await page.keyboard.press('Escape');
  await expectMenuClosed(page);
  // Closing without choosing a section keeps the page where it was.
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  await expect(page.locator('.menu-toggle')).toBeFocused();
});

test('pula a barra com o primeiro Tab', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('destaca na barra a seção que está na tela', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The section links appear in the bar on wide screens.');
  await page.goto('/');
  await page
    .locator('.site-nav')
    .getByRole('link', { name: 'Projects' })
    .click();
  await expect(
    page.locator('.site-nav').getByRole('link', { name: 'Projects' }),
  ).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('.site-header')).toHaveClass(
    /site-header--scrolled/,
  );
});

test('mantém o menu funcionando com cliques rápidos', async ({ page }) => {
  await page.goto('/');
  // A second click while the page is still moving back is ignored.
  await page.locator('.menu-toggle').dblclick();
  await expect(page.locator('.stack-menu')).toHaveClass(/stack-menu--open/);
  await waitForTransitions(page);
  await page.locator('.menu-toggle').click();
  await expectMenuClosed(page);
  await openSection(page, 'courses');
});

test('volta a página para a frente com um clique nela', async ({ page }) => {
  await page.goto('/');
  await openMenu(page);
  await page.locator('.stage-catcher').click();
  await expectMenuClosed(page);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('segue o tema do sistema enquanto o visitante não escolhe', async ({
  page,
}) => {
  const html = page.locator('html');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(html).toHaveClass(/\blight\b/);
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(246, 246, 251)',
  );
  // Once React starts, the page listens to the system's theme, and the
  // browser's bar takes the theme's color.
  for (const meta of await page.locator('meta[name="theme-color"]').all()) {
    await expect(meta).toHaveAttribute('content', '#f6f6fb');
  }
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(html).not.toHaveClass(/\blight\b/);
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(22, 23, 27)',
  );
});

test('alterna o tema pelo botão e lembra a escolha', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const viewTransitions = await countViewTransitions(page);
  // Records the theme as the page is read, before React starts.
  await page.addInitScript(() =>
    document.addEventListener('DOMContentLoaded', () =>
      Object.assign(window, {
        themeAtStart: document.documentElement.className,
      }),
    ),
  );
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveClass(/\bdark\b/);

  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(html).toHaveClass(/\blight\b/);
  await expect(html).not.toHaveClass(/\bdark\b/);
  // The new theme spreads in a circle from the button.
  expect(await viewTransitions()).toBe(1);
  await expect(html).not.toHaveClass(/theme-switching/);
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(246, 246, 251)',
  );
  // The browser's bar on phones follows the chosen theme.
  for (const meta of await page.locator('meta[name="theme-color"]').all()) {
    await expect(meta).toHaveAttribute('content', '#f6f6fb');
  }
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(
    'light',
  );

  // The next visit starts in the chosen theme, before the page is drawn.
  await page.reload();
  expect(
    await page.evaluate(
      () => (window as unknown as { themeAtStart: string }).themeAtStart,
    ),
  ).toMatch(/\blight\b/);
  await expect(html).toHaveClass(/\blight\b/);
  // Once React starts, the browser's bar takes the stored theme too, and the
  // button answers clicks.
  for (const meta of await page.locator('meta[name="theme-color"]').all()) {
    await expect(meta).toHaveAttribute('content', '#f6f6fb');
  }

  // Going back to the system's theme forgets the choice.
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(html).toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
  await openSection(page, 'contact');
  expect(errors).toEqual([]);
});

test('respeita a preferência por reduzir movimento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const viewTransitions = await countViewTransitions(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await expect(page.locator('.hero__title-accent')).toHaveCSS(
    'animation-name',
    'none',
  );
  // The timeline is drawn at once and the ribbon stands still.
  await expect(page.locator('.xp__rail-fill')).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect(page.locator('.tech-ribbon__row').first()).toHaveCSS(
    'animation-name',
    'none',
  );
  await openSection(page, 'projects');
  await openSection(page, 'about');
  // The theme changes at once, without the circle that spreads from the
  // button.
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveClass(/\blight\b/);
  expect(await viewTransitions()).toBe(0);
});

test('abre e recolhe as experiências profissionais', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'experience');
  const items = page.locator('#experience .xp-item');
  await expect(items).toHaveCount(8);
  await expect(items.first().getByRole('heading', { level: 3 })).toHaveText(
    'Software Engineer (Node.js / GraphQL Platform)',
  );
  // Months must not depend on the time zone of the machine that builds.
  await expect(items.first().locator('.xp-item__period')).toContainText(
    'Oct 2025 — Present',
  );
  await expect(items.nth(1).locator('.xp-item__period')).toHaveText(
    'Feb 2025 — Mar 2026 · 1y 1m',
  );
  await expect(items.last().locator('.xp-item__period')).toHaveText(
    'May 2017 — Apr 2018 · 11m',
  );
  // The tags and the ribbon repeat technologies that the descriptions name.
  await expect(
    items.nth(1).getByRole('list', { name: 'Technologies' }),
  ).toContainText('Azure DevOps');
  await expect(page.locator('#experience .tech-ribbon')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(page.locator('#experience .tech-ribbon')).toContainText(
    'Step Functions',
  );

  // The current role starts open; the others open and close on a click.
  await expect(items.first().locator('.xp-card__toggle')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  const second = items.nth(1);
  const toggle = second.locator('.xp-card__toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(second.getByText('Microsoft SQL Server')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(second.getByText('Microsoft SQL Server')).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(second.getByText('Microsoft SQL Server')).toBeHidden();
});

test('alterna as etapas da formação acadêmica', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'education');
  const education = page.locator('#education');
  const tab = (name: string) => education.getByRole('tab', { name });
  // Only the chosen step's panel is shown.
  const panel = education.getByRole('tabpanel');
  await expect(education.getByRole('tab')).toHaveCount(5);
  await expect(panel).toHaveCount(1);
  await expect(panel.getByRole('heading', { level: 3 })).toHaveText(
    'Colégio Salesiano Santa Teresinha',
  );
  await scrollTo(page, '#education .edu');
  await tab('University Education').click();
  await expect(tab('University Education')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(tab('Elementary School')).toHaveAttribute(
    'aria-selected',
    'false',
  );
  await expect(panel.getByRole('heading', { level: 3 })).toHaveText(
    'Universidade São Judas Tadeu',
  );
  // The arrow keys, Home and End move between the steps, as in any tabs.
  await page.keyboard.press('ArrowDown');
  await expect(tab('Postgraduate')).toBeFocused();
  await expect(panel.getByRole('heading', { level: 3 })).toHaveText(
    'Which course?',
  );
  await page.keyboard.press('End');
  await expect(tab('Doctorate Degree')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.keyboard.press('ArrowDown');
  await expect(tab('Elementary School')).toBeFocused();
  await expect(tab('Elementary School')).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('mostra os detalhes de um curso em um modal', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'courses');
  const courses = page.locator('#courses .course-card');
  await expect(courses).toHaveCount(6);
  await courses.first().getByRole('button').click();
  // The dialog is named after the course.
  const dialog = page.getByRole('dialog', {
    name: 'Full-Stack Developer - IGTI',
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Second Module - Node.js')).toBeVisible();
  // Only text inside, so the body takes focus to scroll from the keyboard.
  await expect(dialog.locator('.modal-body--focusable')).toHaveAttribute(
    'tabindex',
    '0',
  );
  await dialog.locator('footer').getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();

  // The cards open from the keyboard too. The focus goes into the dialog
  // and back to the card when it closes.
  const last = courses.last().getByRole('button');
  await last.focus();
  await page.keyboard.press('Enter');
  const physics = page.getByRole('dialog', { name: 'Advanced Physics' });
  await expect(physics).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(physics).toBeHidden();
  await expect(last).toBeFocused();
});

test('navega pelos projetos e abre os detalhes', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'projects');
  const projects = page.locator('#projects');
  await expect(projects.locator('.project-card')).toHaveCount(5);
  const current = projects.locator(
    '.project-card[aria-current="true"] .project-card__title',
  );
  await expect(current).toHaveText('CSS');
  await projects.getByRole('button', { name: 'Next Project' }).click();
  await expect(current).toHaveText('Sensei');
  await projects.getByRole('button', { name: 'Previous Project' }).click();
  await expect(current).toHaveText('CSS');
  // The arrows go around.
  await projects.getByRole('button', { name: 'Previous Project' }).click();
  await expect(current).toHaveText('Malka RH');
  await waitForProjectsTrack(page);

  await projects
    .getByRole('button', { name: 'See details about Malka RH' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Malka RH' });
  await expect(dialog).toBeVisible();
  const link = dialog.getByRole('link', { name: /See more about the website/ });
  await expect(link).toHaveAttribute(
    'href',
    'http://malkarh.com.br/lp/recrutamento-e-selecao/',
  );
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await dialog.locator('footer').getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await projects.getByRole('button', { name: 'Next Project' }).click();
  await expect(current).toHaveText('CSS');
  await waitForProjectsTrack(page);

  // A swipe scrolls the track, and the current project follows it.
  await projects
    .locator('.projects__track')
    .evaluate((track) =>
      track.scrollTo({ left: track.scrollWidth, behavior: 'instant' }),
    );
  await expect(current).toHaveText('Malka RH');
});

test('abre as fotos das iniciativas de contribuição', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'contributing');
  const photos = page.locator('#contributing .contrib-card__button');
  await expect(photos).toHaveCount(4);
  await scrollTo(page, '#contributing .contrib-grid');
  await photos.first().click();
  // The viewer is named after the initiative and tells what it was about.
  await expect(
    page.getByRole('dialog', { name: 'Easter donation campaigns' }),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog').getByText(/^Delivering gifts, food/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Next photo' }).click();
  await expect(
    page.getByRole('dialog', { name: "Children's Day events" }),
  ).toBeVisible();
  // The arrow keys browse the photos too, and go around.
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(
    page.getByRole('dialog', { name: 'General donation drives' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(photos.first()).toBeFocused();
});

test('mostra os dados de contato', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'contact');
  const cards = page.locator('#contact .contact-card');
  await expect(cards.getByRole('heading', { level: 3 })).toHaveText([
    'Bruno Garcia da Silva',
    'Bachelor of Computer Science',
    'bruno-151299@hotmail.com',
    'Advanced English',
  ]);
  const contact = page.locator('#contact .contact-card--contact');
  await expect(
    contact.getByRole('link', { name: 'bruno-151299@hotmail.com' }),
  ).toHaveAttribute('href', 'mailto:bruno-151299@hotmail.com');
  await expect(
    contact.getByRole('link', { name: '+55 (11) 99696-9301' }),
  ).toHaveAttribute('href', 'tel:+5511996969301');
  await expect(page.locator('#contact .contact-card--profile')).toContainText(
    /\d+ years/,
  );
  const links = page.locator('#contact .contact-links a');
  await expect(links).toHaveText(['Email', 'LinkedIn', 'WhatsApp', 'GitHub']);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
});

test('fecha a página com o rodapé', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await expect(footer.locator('.social-links a')).toHaveCount(4);
  await expect(footer.locator('.site-footer__year')).toHaveText(
    String(new Date().getUTCFullYear()),
  );
  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  );
  await footer.getByRole('link', { name: 'Back to top' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('oferece o currículo e os canais de contato', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const resumeLink = page
    .locator('#top')
    .getByRole('link', { name: 'Download CV', exact: true });
  await expect(resumeLink).toHaveAttribute(
    'href',
    '/documents/cv/Bruno_Garcia_Resume.zip',
  );
  const downloadPromise = page.waitForEvent('download');
  await resumeLink.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Bruno_Garcia_Resume.zip');
  const response = await request.get('/documents/cv/Bruno_Garcia_Resume.zip');
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 2).toString()).toBe('PK');

  const social = page.locator('.hero__social a');
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
  for (const link of await social.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await expect(page.locator('.site-header__cv')).toHaveAttribute(
    'download',
    'Bruno_Garcia_Resume.zip',
  );
  await expect(page.getByRole('link', { name: 'text me' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
});

test('publica ícones e manifesto que existem', async ({ page, request }) => {
  await page.goto('/');
  const manifestHref = await page
    .locator('link[rel="manifest"]')
    .getAttribute('href');
  expect(manifestHref).toBe('/favicon/manifest.json');
  const manifest = await (await request.get(manifestHref!)).json();
  expect(manifest.name).toBe('Bruno Garcia');
  const icons = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const tileImage = await page
    .locator('meta[name="msapplication-TileImage"]')
    .getAttribute('content');
  for (const src of [
    ...icons,
    ...manifest.icons.map((icon: { src: string }) => icon.src),
    tileImage,
  ]) {
    expect(src).toMatch(/^\/favicon\//);
    const response = await request.get(src!);
    expect(response.ok(), src!).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
  }
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

test('envia o feedback ao Netlify Forms e confirma o envio', async ({
  page,
}) => {
  let payload: URLSearchParams | undefined;
  let url: string | undefined;
  await page.route('**/*', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    url = route.request().url();
    payload = new URLSearchParams(route.request().postData() ?? '');
    await route.fulfill({ status: 200, body: '' });
  });
  await page.goto('/');
  const dialog = await fillFeedback(page);
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(dialog).toBeHidden();
  // A status, so screen readers announce it.
  await expect(
    page.getByRole('status').getByText('Message Submitted'),
  ).toBeVisible();
  await expect(
    page.getByText('Thank you very much for your feedback!'),
  ).toBeVisible();
  // Netlify Forms only accepts submissions posted to a static file.
  expect(new URL(url!).pathname).toBe('/contact.html');
  expect(payload?.get('form-name')).toBe('contact');
  expect(payload?.get('bot-field')).toBe('');
  expect(payload?.get('fullName')).toBe('Visitante de Teste');
  expect(payload?.get('email')).toBe('visitante@example.com');
  expect(payload?.get('feedback')).toBe('Gostei muito do portfólio.');

  await page.keyboard.press('Escape');
  await expect(page.getByText('Message Submitted')).toBeHidden();
});

test('declara ao Netlify todos os campos do feedback', async ({
  page,
  request,
}) => {
  const html = await (await request.get('/contact.html')).text();
  await page.setContent(html);
  const declared = await page
    .locator('form[name="contact"][data-netlify="true"]')
    .evaluate((form) =>
      [...(form as HTMLFormElement).elements]
        .map((field) => field.getAttribute('name'))
        .sort(),
    );
  await expect(page.locator('form[name="contact"]')).toHaveAttribute(
    'netlify-honeypot',
    'bot-field',
  );

  await page.goto('/');
  const dialog = await openFeedbackForm(page);
  const sent = await dialog
    .locator('form[name="contact"]')
    .evaluate((form) =>
      [...new FormData(form as HTMLFormElement).keys()].sort(),
    );
  expect(sent).toEqual(declared);
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
  await page.getByRole('button', { name: 'Close notification' }).click();
  await expect(page.getByText('We had a problem')).toBeHidden();
});

test('mostra a página 404 no estilo do site e volta ao portfólio', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/pagina-inexistente');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(
    'Page Not Found | Bruno Garcia — Dev. Full-Stack',
  );
  for (const robots of await page.locator('meta[name="robots"]').all()) {
    await expect(robots).toHaveAttribute('content', /noindex/);
  }
  await expect(page.getByRole('main')).toContainText('Page Not Found');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page Not Found' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to the portfolio', exact: true }),
  ).toHaveAttribute('href', '/');
  // The menu links lead to the sections of the home page.
  await openMenu(page);
  await expect(
    page.locator('.stack-menu__link').filter({ hasText: 'Contact' }),
  ).toHaveAttribute('href', '/#contact');
  await page.keyboard.press('Escape');
  await expectMenuClosed(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page
    .getByRole('link', { name: 'go back to the portfolio', exact: true })
    .click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('#top h1')).toBeVisible();
  await openSection(page, 'contact');
  expect(errors).toEqual([]);
});

test('aplica os cabeçalhos de segurança sem bloquear o site', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.assign(window, { cspViolations: violations });
    document.addEventListener('securitypolicyviolation', (event) =>
      violations.push(`${event.violatedDirective} ${event.blockedURI}`),
    );
  });
  await page.route('**/*', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 200, body: '' })
      : route.continue(),
  );
  const response = await page.goto('/');
  const headers = response!.headers();
  expect(headers['content-security-policy']).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers['content-security-policy']).toContain("object-src 'none'");
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['permissions-policy']).toContain('camera=()');
  expect(headers['x-powered-by']).toBeUndefined();

  // Exercises every section, every dialog and the form.
  const dialog = await fillFeedback(page);
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Message Submitted')).toBeVisible();
  for (const id of sections.slice(1)) {
    await openSection(page, id);
  }
  await openSection(page, 'courses');
  await page
    .locator('#courses .course-card')
    .first()
    .getByRole('button')
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await openSection(page, 'contributing');
  await page.locator('#contributing .contrib-card__button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await openSection(page, 'projects');
  await page.getByRole('button', { name: 'See details about CSS' }).click();
  await expect(page.getByRole('dialog', { name: 'CSS' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => (window as unknown as { cspViolations: string[] }).cspViolations,
    ),
  ).toEqual([]);
});

test('publica os metadados de busca e compartilhamento', async ({
  page,
  request,
}) => {
  const siteUrl = 'https://brgarcias-portfolio.netlify.app';
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    siteUrl,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    siteUrl,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Bruno Garcia — Dev. Full-Stack',
  );
  // Links shared on WhatsApp and LinkedIn show the large image.
  const ogImage = page.locator('meta[property="og:image"]');
  await expect(ogImage).toHaveAttribute(
    'content',
    new RegExp(`^${siteUrl}/opengraph-image`),
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    'content',
    '1200',
  );
  await expect(
    page.locator('meta[property="og:image:height"]'),
  ).toHaveAttribute('content', '630');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  const imageUrl = new URL((await ogImage.getAttribute('content'))!);
  const image = await request.get(imageUrl.pathname + imageUrl.search);
  expect(image.ok()).toBe(true);
  expect(image.headers()['content-type']).toBe('image/jpeg');
  const person = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      '{}',
  );
  expect(person).toMatchObject({
    '@type': 'Person',
    name: 'Bruno Garcia',
    jobTitle: 'Full-Stack Developer',
    url: `${siteUrl}/`,
  });
  expect(person.sameAs).toEqual([
    'https://www.linkedin.com/in/bruno-garcia-9854b1161/',
    'https://github.com/brgarcias',
  ]);

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Allow: /');
  expect(robots).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain(`<loc>${siteUrl}/</loc>`);
});

test('hidrata a página com o comentário que o Netlify injeta no head', async ({
  page,
}) => {
  // On *.netlify.app, production pages get a line break and an HTML comment
  // right after <meta charset>. React 19 cannot hydrate that text node.
  await page.route(
    (url) => url.pathname === '/',
    async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replace(
        '<meta charSet="utf-8"/>',
        '<meta charSet="utf-8"/>\n<!-- This site is hosted on Netlify. -->',
      );
      await route.fulfill({ response, body: html });
    },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#top h1')).toBeVisible();
  await page.waitForFunction(() => document.readyState === 'complete');
  await openSection(page, 'contact');
  expect(errors).toEqual([]);
});

test('mostra a página de erro e recupera o site com Try again', async ({
  page,
}) => {
  // On the first load only, a browser without IntersectionObserver breaks the
  // sections that enter as they scroll into view.
  await page.addInitScript(() => {
    if (sessionStorage.getItem('broken')) return;
    sessionStorage.setItem('broken', '1');
    Reflect.deleteProperty(window, 'IntersectionObserver');
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Something Went Wrong' }),
  ).toBeVisible();
  // Only the section failed, so the header and its menu remain.
  await expect(page.locator('.site-header')).toBeVisible();

  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.locator('#top h1')).toBeVisible();
  await openSection(page, 'contact');
});

test('mostra a página de erro quando o próprio layout falha', async ({
  page,
}) => {
  // The page keeps the theme it was in.
  await page.emulateMedia({ colorScheme: 'light' });
  // Only the layout's header observes #top, the hero, to highlight the
  // current section, so this breaks the layout alone.
  await page.addInitScript(() => {
    const observe = IntersectionObserver.prototype.observe;
    IntersectionObserver.prototype.observe = function (target: Element) {
      if (target.id === 'top') throw new Error('Simulated failure');
      return observe.call(this, target);
    };
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Something Went Wrong' }),
  ).toBeVisible();
  // The global error page replaces the layout, header included.
  await expect(page.locator('.site-header')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveClass(/\blight\b/);
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(246, 246, 251)',
  );
});
