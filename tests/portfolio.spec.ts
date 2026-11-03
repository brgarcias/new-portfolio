import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  countViewTransitions,
  expectMenuClosed,
  findSpills,
  openFeedbackForm,
  openMenu,
  openSection,
  pageOverflow,
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

test('não deixa texto vazar da caixa no celular', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The narrow layouts are the phones.');
  // On the narrowest phones and on the tests' one, in the three languages:
  // no text runs past its own box, as the contributing numbers' labels did,
  // into each other and past their card.
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 700 });
    for (const path of ['/', '/pt', '/es']) {
      await page.goto(path);
      const spills = await findSpills(page);
      expect(spills, `${path} at ${width}px`).toEqual([]);
    }
  }
});

test('carrega o portfólio sem erros e sem rolagem horizontal', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  // Regenerated daily, so the durations stay current.
  expect(response?.headers()['cache-control']).toContain('s-maxage=86400');
  await expect(page).toHaveTitle('Bruno Garcia — Full-Stack Software Engineer');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.locator('meta[name="google-site-verification"]'),
  ).toHaveAttribute('content', 'zE-A_JWezHcTY0RPEAiraoj-ORR540i46tyJwSk0T3s');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Full-Stack Software Engineer',
  );
  await expect(page.locator('#top .hero__status')).toHaveText(
    'Currently Software Engineer at PayPal',
  );
  // The work comes right after the top, and the sections in this order.
  expect(
    await page
      .locator('main section[id]')
      .evaluateAll((all) => all.map((section) => section.id)),
  ).toEqual(['top', ...sections]);
  expect(await pageOverflow(page)).toBeLessThanOrEqual(0);
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
    'Engenheiro de Software Full-Stack',
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
  await expect(page.locator('#contact')).toContainText('São Paulo, Brasil');
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
    'Ingeniero de Software Full-Stack',
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
  await expect(page.locator('#projects h2')).toHaveText('Projetos em destaque');
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

test('mantém os links do menu abaixo da barra em telas baixas', async ({
  page,
}) => {
  // A small phone, and one lying down: the page goes further down, and the links
  // ran under the bar.
  for (const [width, height] of [
    [320, 568],
    [874, 370],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('/pt');
    await openMenu(page);
    const bar = (await page.locator('.site-header').boundingBox())!;
    const first = (await page
      .locator('.stack-menu__link')
      .first()
      .boundingBox())!;
    expect(first.y, `${width}x${height}`).toBeGreaterThanOrEqual(
      bar.y + bar.height,
    );
    await expect(page.locator('.stage-catcher')).toBeInViewport();
    await page.keyboard.press('Escape');
    await expectMenuClosed(page);
  }
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
  const nav = page.locator('.site-nav');
  // The bar has the sections a visitor looks for; the menu has them all.
  await expect(nav.getByRole('link')).toHaveText([
    'Work',
    'Expertise',
    'Experience',
    'About',
    'Contact',
  ]);
  await nav.getByRole('link', { name: 'Work' }).click();
  await expect(nav.getByRole('link', { name: 'Work' })).toHaveAttribute(
    'aria-current',
    'location',
  );
  await expect(page.locator('.site-header')).toHaveClass(
    /site-header--scrolled/,
  );
});

test('junta o botão de tema ao do menu enquanto o menu está aberto', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Phones do not show the résumé button in the bar.');
  await page.goto('/');
  const resume = page.locator('.site-header__cv');
  const space = async () => {
    const theme = await page
      .locator('.site-header .theme-toggle')
      .boundingBox();
    const menu = await page.locator('.menu-toggle').boundingBox();
    return menu!.x - (theme!.x + theme!.width);
  };
  const before = await space();
  // The résumé button fades out, and the theme button takes its place, with
  // the bar's usual gap of 0.75rem.
  await openMenu(page);
  await expect(resume).toBeHidden();
  await expect(page.locator('.site-nav')).toBeHidden();
  expect(await space()).toBeCloseTo(12, 0);
  await page.keyboard.press('Escape');
  await expectMenuClosed(page);
  await waitForTransitions(page);
  await expect(resume).toBeVisible();
  expect(await space()).toBeCloseTo(before, 0);
});

test('leva ao jogo pelo botão do topo', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('#top').getByRole('link', { name: 'Play' }),
  ).toHaveAttribute('href', '/play');
  await page.goto('/pt');
  await expect(
    page.locator('#top').getByRole('link', { name: 'Jogar' }),
  ).toHaveAttribute('href', '/pt/play');
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

test('troca o tema com o menu aberto sem mexer nas páginas', async ({
  page,
}) => {
  const viewTransitions = await countViewTransitions(page);
  await page.goto('/');
  await openMenu(page);
  const sheet = page.locator('.stage__sheet');
  const before = await sheet.boundingBox();
  await page.locator('.site-header .theme-toggle').click();
  const html = page.locator('html');
  await expect(html).toHaveClass(/\blight\b/);
  // With the page sitting back in 3D, the colors fade instead of the circle,
  // whose snapshot does not keep the 3D in every browser.
  expect(await viewTransitions()).toBe(0);
  await expect(html).not.toHaveClass(/theme-fading/);
  expect(await sheet.boundingBox()).toEqual(before);
  await page.keyboard.press('Escape');
  await expectMenuClosed(page);
  await expect(page.locator('body')).toHaveCSS(
    'background-color',
    'rgb(246, 246, 251)',
  );
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
  // Buttons do not shrink under the finger.
  const contact = page.locator('#top .btn--primary');
  const box = (await contact.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(contact).toHaveCSS('scale', 'none');
  await page.mouse.up();
});

test('encolhe os botões sob o dedo e os solta com uma mola', async ({
  page,
}) => {
  await page.goto('/');
  // Once React starts, the buttons answer the touch.
  for (const meta of await page.locator('meta[name="theme-color"]').all()) {
    await expect(meta).toHaveAttribute('content', '#16171b');
  }
  // A small button shrinks to 94%.
  const theme = page.locator('.site-header .theme-toggle');
  const box = (await theme.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(theme).toHaveCSS('scale', '0.94');
  await page.mouse.up();
  await expect(theme).toHaveCSS('scale', 'none');
});

test('abre uma experiência pela seta do título', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#experience .xp-item').nth(1).locator('.xp-card');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS('opacity', '1');
  const toggle = card.locator('.xp-card__toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  // A press that lasts, as a person's: the title shrinks meanwhile, and the
  // release still lands on it.
  const arrow = (await card.locator('.xp-card__chevron').boundingBox())!;
  await page.mouse.move(arrow.x + arrow.width / 2, arrow.y + arrow.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.up();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
});

test('pausa as animações em loop fora da tela', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('#top');
  const float = hero.locator('.hero__float');
  await expect(float).toHaveCSS('animation-play-state', 'running');
  await openSection(page, 'contact');
  await expect(hero).toHaveAttribute('data-offscreen');
  await expect(float).toHaveCSS('animation-play-state', 'paused');
  await openSection(page, 'about');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(hero).not.toHaveAttribute('data-offscreen');
  await expect(float).toHaveCSS('animation-play-state', 'running');
});

test('abre e recolhe as experiências profissionais', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'experience');
  const items = page.locator('#experience .xp-item');
  await expect(items).toHaveCount(8);
  // The early roles wait behind a button, which takes the focus to the first
  // of them.
  const shown = page.locator('#experience .xp-item:visible');
  await expect(shown).toHaveCount(5);
  await expect(items.nth(5)).toBeHidden();
  const earlier = page.getByRole('button', { name: 'Show 3 earlier roles' });
  await expect(earlier).toHaveAttribute('aria-expanded', 'false');
  await earlier.click();
  await expect(shown).toHaveCount(8);
  await expect(items.nth(5).locator('.xp-card__toggle')).toBeFocused();
  const later = page.getByRole('button', { name: 'Hide earlier roles' });
  await expect(later).toHaveAttribute('aria-expanded', 'true');
  await later.click();
  await expect(shown).toHaveCount(5);
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

  // The details are valid lists: each group's heading comes before its own
  // list, and a list holds only items.
  const grouped = items.nth(4).locator('.xp-card__details');
  await expect(grouped.locator('h4')).toHaveText([
    'Tech Lead (2023–2024)',
    'Backend Developer (2022–2023)',
    'Frontend Developer (2021–2022)',
  ]);
  await expect(grouped.locator('ul')).toHaveCount(3);
  await expect(
    page.locator('#experience .xp-card__details ul > :not(li)'),
  ).toHaveCount(0);
});

test('mostra a formação em computação, sem o histórico escolar', async ({
  page,
}) => {
  await page.goto('/');
  await openSection(page, 'education');
  const education = page.locator('#education');
  await expect(education.getByRole('heading', { level: 3 })).toHaveText([
    'Universidade São Judas Tadeu',
  ]);
  await expect(education).toContainText('Bachelor of Computer Science');
  // What does not help to assess the work stays out.
  await expect(education).not.toContainText('Colégio');
  await expect(education.getByRole('tab')).toHaveCount(0);
});

test('mostra o que o Bruno faz, por área e com onde fez', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'expertise');
  const expertise = page.locator('#expertise');
  await expect(expertise.getByRole('heading', { level: 3 })).toHaveText([
    'Backend Engineering',
    'Distributed Systems',
    'Cloud Architecture',
    'Databases & Data',
    'Frontend Engineering',
    'Testing & Quality',
    'Technical Leadership',
  ]);
  // Each area says where it was done, and a number only with what it measures.
  const rows = expertise.locator('.ledger__row');
  await expect(rows).toHaveCount(7);
  await expect(rows.locator('.ledger__where')).toHaveCount(7);
  await expect(rows.first().locator('.ledger__metric')).toContainText(
    '30%faster API',
  );
  await expect(rows.nth(1).locator('.ledger__metric')).toHaveCount(0);
  await expect(rows.nth(2).locator('.ledger__stack')).toContainText(
    'AWS Lambda · API Gateway · SQS',
  );
  // No skill bars or percentages of knowledge.
  await expect(expertise.getByRole('progressbar')).toHaveCount(0);
});

test('no celular, deixa o CV ao lado das redes e o jogo como botão', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Only phones change them.');
  // Measured with nothing moving: the top's buttons rise in as the page opens.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Beside: in the same row, right after the last one.
  const expectBeside = async (first: Locator, second: Locator) => {
    const left = (await first.boundingBox())!;
    const right = (await second.boundingBox())!;
    expect(
      Math.abs(right.y + right.height / 2 - (left.y + left.height / 2)),
    ).toBeLessThan(2);
    expect(right.x).toBeGreaterThanOrEqual(left.x + left.width);
  };
  for (const width of [320, 390, 440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/pt');
    const top = page.locator('#top');
    const cv = top.getByRole('link', { name: 'Baixar CV', exact: true });
    await expect(cv).toHaveAttribute('download', 'Bruno_Garcia_Resume.pdf');
    await expect(cv.locator('svg')).toBeVisible();
    await expectBeside(top.locator('.social-links li').last(), cv);
    await expect(
      top.getByRole('link', { name: 'Baixar currículo' }),
    ).toHaveCount(0);
    // The game is a button among the actions, and only there.
    const play = top.getByRole('link', { name: 'Jogar' });
    await expect(play).toHaveCount(1);
    await expect(play).toHaveClass(/btn/);
    await expect(play).toHaveAttribute('href', '/pt/play');
    await expectBeside(top.getByRole('link', { name: 'Fale comigo' }), play);

    // The menu, as the top.
    await openMenu(page);
    const menu = page.locator('.stack-menu');
    await expectBeside(
      menu.locator('.social-links li').last(),
      menu.getByRole('link', { name: 'Baixar CV', exact: true }),
    );
    await page.keyboard.press('Escape');
    await expectMenuClosed(page);

    // The contact, as the top.
    const links = page.locator('#contact .contact__links');
    await expectBeside(
      links.getByRole('link', { name: 'GitHub' }),
      links.getByRole('link', { name: 'Baixar CV', exact: true }),
    );
  }
});

test('deixa o topo inteiro na primeira tela de um notebook', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Laptops.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [
    [1024, 768],
    [1366, 657],
  ]) {
    await page.setViewportSize({ width, height });
    for (const path of ['/', '/pt', '/es']) {
      await page.goto(path);
      const where = `${path} at ${width}x${height}`;
      // The three buttons in one row, and the companies still on the screen.
      const rows = await page
        .locator('#top .hero__actions .btn:visible')
        .evaluateAll((all) =>
          all.map((button) => Math.round(button.getBoundingClientRect().top)),
        );
      expect(rows, where).toHaveLength(3);
      expect(new Set(rows).size, where).toBe(1);
      const proof = (await page.locator('#top .hero__proof').boundingBox())!;
      expect(proof.y + proof.height, where).toBeLessThanOrEqual(height);
    }
  }
});

test('mantém as empresas numa linha só no celular', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The narrow layouts are the phones.');
  for (const width of [360, 390, 402, 440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const rows = await page
      .locator('#top .hero__companies li')
      .evaluateAll((all) =>
        all.map((company) => Math.round(company.getBoundingClientRect().top)),
      );
    expect(new Set(rows).size, `${width}px`).toBe(1);
  }
});

test('continua inteiro quando um pedaço do código falha ao baixar', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // What loads after the page: the animations of the blocks, which are tried
  // again, and the code of the dialogs, which only matters when one opens.
  const later = /\/chunks\/\d+\.[0-9a-f]+\.js/;
  const failed = new Set<string>();
  await page.route(later, (route) => {
    failed.add(route.request().url());
    return route.abort();
  });
  await page.goto('/');
  await expect.poll(() => failed.size, { timeout: 15_000 }).toBeGreaterThan(2);
  await page.unroute(later);
  await scrollTo(page, '#courses .course-list');
  await expect(page.locator('#courses .course-list-wrap')).toHaveCSS(
    'opacity',
    '1',
    { timeout: 15_000 },
  );
  await page.locator('#courses .course__button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe('sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('mostra os blocos que entram com a rolagem', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#expertise .ledger-wrap')).toHaveCSS(
      'opacity',
      '1',
    );
    await expect(page.locator('#contact .contact')).toHaveCSS('opacity', '1');
  });
});

test('segue o tema escolhido em outra aba', async ({ page, context }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveClass(/dark/);
  const other = await context.newPage();
  await other.goto('/');
  await other.locator('.site-header .theme-toggle').click();
  await expect(html).toHaveClass(/light/);
  await other.locator('.site-header .theme-toggle').click();
  await expect(html).toHaveClass(/dark/);
});

test('leva ao trabalho, ao currículo e ao contato pelos botões do topo', async ({
  page,
}) => {
  await page.goto('/');
  const top = page.locator('#top');
  await expect(top.locator('.hero__proof li')).toHaveText([
    'PayPal',
    'AB InBev',
    'Serasa',
    'Domy',
    'Trocafone',
  ]);
  await expect(top.getByRole('link', { name: 'Contact me' })).toHaveAttribute(
    'href',
    '#contact',
  );
  await top
    .locator('.hero__actions')
    .evaluate((actions) =>
      Promise.all(
        actions.getAnimations().map((animation) => animation.finished),
      ),
    );
  await top.getByRole('link', { name: 'Explore my work' }).click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.locator('#projects h2')).toBeInViewport();
});

test('destaca um estudo de caso, com a tela real e o fluxo do sistema', async ({
  page,
}) => {
  await page.goto('/');
  await openSection(page, 'projects');
  const featured = page.locator('#projects .case-feature');
  await expect(featured.getByRole('heading', { level: 3 })).toHaveText(
    'Store orders processed in queues',
  );
  await expect(featured.locator('.case-feature__label')).toHaveText(
    'Featured case study',
  );
  await expect(
    featured.getByRole('img', { name: 'Store orders processed in queues' }),
  ).toBeVisible();
  // The system's flow, step by step, in order, with the data going through it.
  await expect(
    featured
      .getByRole('list', {
        name: 'System flow — Store orders processed in queues',
      })
      .getByRole('listitem'),
  ).toHaveText([
    /^Nuvemshop store/,
    /^Webhook/,
    /^SQS queue/,
    /^Worker Lambdas/,
    /^Redis/,
  ]);
  await expect(featured.locator('.flow__pulse').first()).toHaveCSS(
    'animation-name',
    'flow-pulse',
  );
  await expect(page.locator('#projects .case-feature-wrap')).toHaveCSS(
    'opacity',
    '1',
  );
  await featured.getByRole('button', { name: 'Read the case study' }).click();
  const store = page.getByRole('dialog', {
    name: 'Store orders processed in queues',
  });
  await expect(store).toBeVisible();
  await expect(store.getByRole('heading', { level: 3 })).toHaveText([
    'Context',
    'My role',
    'What I built',
    'Engineering decisions',
    'What I learned',
  ]);
  await expect(store.locator('.case-details__decisions li')).toHaveCount(2);
  await expect(
    store.getByRole('img', { name: 'Store orders processed in queues' }),
  ).toBeVisible();
  // Its site is no longer up, so there is no link to it.
  await expect(store.getByRole('link')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(store).toBeHidden();
  await expect(
    featured.getByRole('button', { name: 'Read the case study' }),
  ).toBeFocused();
});

test.describe('com "reduzir movimento"', () => {
  test.use({ reducedMotion: 'reduce' });

  test('não anima o fluxo do estudo em destaque', async ({ page }) => {
    await page.goto('/');
    await openSection(page, 'projects');
    const featured = page.locator('#projects .case-feature');
    await expect(featured.locator('.flow__pulse').first()).toHaveCSS(
      'animation-name',
      'none',
    );
    await expect(featured.locator('.flow__pulse').first()).toHaveCSS(
      'opacity',
      '0',
    );
  });
});

test('mostra os estudos de caso e abre cada um num diálogo', async ({
  page,
}) => {
  await page.goto('/');
  await openSection(page, 'projects');
  const cases = page.locator('#projects .case-card');
  const shown = page.locator('#projects .case-card:visible');
  // After the featured case, one from each company; a button shows the others.
  await expect(cases).toHaveCount(6);
  await expect(shown.locator('.case-card__where')).toHaveText([
    'PayPal · Since 2025',
    'AB InBev · 2025–2026',
    'Trocafone · 2023–2024',
    'Serasa · 2024–2025',
  ]);
  // The system's flow, step by step, in order.
  const migration = cases.nth(2);
  await expect(
    migration
      .getByRole('list', {
        name: 'System flow — From a PHP monolith to microservices',
      })
      .getByRole('listitem'),
  ).toHaveText([
    /^Clients/,
    /^GraphQL gateway/,
    /^Microservices/,
    /^Kubernetes/,
  ]);
  // Like the other cards, a click anywhere opens the case.
  await scrollTo(page, '#projects .cases__grid');
  await expect(page.locator('#projects .cases__body')).toHaveCSS(
    'opacity',
    '1',
  );
  await migration.getByRole('button').click();
  const monolith = page.getByRole('dialog', {
    name: 'From a PHP monolith to microservices',
  });
  await expect(monolith).toBeVisible();
  await expect(monolith.getByRole('heading', { level: 3 })).toHaveText([
    'Context',
    'My role',
    'What I built',
    'Engineering decisions',
    'Result',
  ]);
  await expect(
    monolith.getByRole('list', { name: 'Technologies' }),
  ).toContainText('Kubernetes');
  await page.keyboard.press('Escape');
  await expect(monolith).toBeHidden();
  // A part the content leaves empty does not show, nor a link it lacks.
  await cases.first().getByRole('button').click();
  const platform = page.getByRole('dialog', {
    name: 'Leaner GraphQL for services and frontends',
  });
  await expect(platform.getByRole('heading', { level: 3 })).toHaveText([
    'Context',
    'My role',
    'What I built',
    'Result',
  ]);
  await expect(platform.getByRole('link')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(platform).toBeHidden();

  // The button shows the other cases and takes the focus to the first of
  // them, so the keyboard goes on from there.
  const more = page.getByRole('button', { name: 'See 2 more case studies' });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.click();
  await expect(shown).toHaveCount(6);
  await expect(cases.nth(4).getByRole('button')).toBeFocused();
  const fewer = page.getByRole('button', { name: 'Show fewer case studies' });
  await expect(fewer).toHaveAttribute('aria-expanded', 'true');
  // From the keyboard too.
  await cases.nth(5).getByRole('button').focus();
  await page.keyboard.press('Enter');
  const repairs = page.getByRole('dialog', { name: /repair/i });
  await expect(repairs).toBeVisible();
  await expect(
    repairs.getByRole('link', { name: 'See more about the website' }),
  ).toHaveAttribute('href', 'https://reparofone.com.br/novaordem');
  await page.keyboard.press('Escape');
  await expect(repairs).toBeHidden();
  // Hiding them again keeps the button on the screen.
  await fewer.click();
  await expect(shown).toHaveCount(4);
  await expect(more).toBeInViewport();
});

test('mostra os detalhes de um curso em um modal', async ({ page }) => {
  await page.goto('/');
  await openSection(page, 'courses');
  await expect(page.locator('#courses .course')).toHaveCount(9);
  // A course without modules has nothing to open.
  const courses = page.locator('#courses .course:has(.course__button)');
  await expect(courses).toHaveCount(5);
  await expect(
    page.locator('#courses .course').first().getByRole('button'),
  ).toHaveCount(0);
  await expect(page.locator('#courses .course-list-wrap')).toHaveCSS(
    'opacity',
    '1',
  );
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

  // The lines open from the keyboard too. The focus goes into the dialog
  // and back to the line when it closes.
  const last = courses.last().getByRole('button');
  await last.focus();
  await page.keyboard.press('Enter');
  const webDevelopment = page.getByRole('dialog', { name: 'Web Development' });
  await expect(webDevelopment).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]')),
      ),
    )
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(webDevelopment).toBeHidden();
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

test('preenche a tela de cada aparelho com a prévia do projeto', async ({
  page,
}) => {
  await page.goto('/');
  await openSection(page, 'projects');
  const cards = page.locator('#projects .project-card');
  await expect(cards).toHaveCount(5);
  for (const card of await cards.all()) {
    const frame = await card.locator('.project-card__frame').boundingBox();
    const screen = await card.locator('.project-card__screen').boundingBox();
    const preview = await card
      .locator('.project-card__screen img')
      .boundingBox();
    // The screen is the frame's, not a box half as wide, and the preview
    // covers all of it.
    expect(screen!.width / frame!.width).toBeGreaterThan(0.6);
    expect(preview!.x).toBeCloseTo(screen!.x, 0);
    expect(preview!.y).toBeCloseTo(screen!.y, 0);
    expect(preview!.width).toBeCloseTo(screen!.width, 0);
    expect(preview!.height).toBeCloseTo(screen!.height, 0);
  }
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

test('mostra os dados de contato', async ({ page, isMobile }) => {
  await page.goto('/');
  await openSection(page, 'contact');
  const contact = page.locator('#contact');
  // The email first, on the page, which hands it to the mail app.
  const email = contact.locator('.contact__email');
  await expect(email).toHaveText('bruno-151299@hotmail.com');
  await expect(email).toHaveAttribute(
    'href',
    'mailto:bruno-151299@hotmail.com',
  );
  await expect(email).not.toHaveAttribute('target');
  // On a phone the résumé's button is short, in the same row.
  const resume = isMobile ? 'Download CV' : 'Download résumé';
  await expect(
    contact.locator('.contact__links').getByRole('link'),
  ).toHaveCount(3);
  for (const name of ['LinkedIn', 'GitHub', resume]) {
    await expect(
      contact.locator('.contact__links').getByRole('link', { name }),
    ).toBeVisible();
  }
  for (const name of ['LinkedIn', 'GitHub']) {
    const link = contact.getByRole('link', { name, exact: true });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await expect(contact.getByRole('link', { name: resume })).toHaveAttribute(
    'download',
    'Bruno_Garcia_Resume.pdf',
  );
  await expect(
    contact.getByRole('link', { name: 'WhatsApp', exact: true }),
  ).toHaveAttribute('target', '_blank');
  const phone = contact.getByRole('link', {
    name: 'Phone: +55 (11) 99696-9301',
  });
  await expect(phone).toHaveAttribute('href', 'tel:+5511996969301');
  await expect(phone).not.toHaveAttribute('target');
  await expect(contact.locator('.contact__facts')).toContainText(
    'São Paulo, Brazil',
  );
  // Only what helps to assess the work: no age, marital status or
  // neighborhood.
  await expect(contact).not.toContainText(/\d+ years|Married|Cachoeirinha/);
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
  isMobile,
}) => {
  await page.goto('/');
  const resumeLink = page.locator('#top').getByRole('link', {
    name: isMobile ? 'Download CV' : 'Download résumé',
    exact: true,
  });
  await expect(resumeLink).toHaveAttribute(
    'href',
    '/documents/cv/Bruno_Garcia_Resume.pdf',
  );
  const downloadPromise = page.waitForEvent('download');
  await resumeLink.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Bruno_Garcia_Resume.pdf');
  // The résumé is the PDF itself, opened without unpacking anything.
  const response = await request.get('/documents/cv/Bruno_Garcia_Resume.pdf');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toBe('application/pdf');
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  // The old ZIP's address, in links shared before, leads to the PDF.
  const old = await request.get('/documents/cv/Bruno_Garcia_Resume.zip', {
    maxRedirects: 0,
  });
  expect(old.status()).toBe(308);
  expect(old.headers()['location']).toMatch(
    /\/documents\/cv\/Bruno_Garcia_Resume\.pdf$/,
  );

  const social = page.locator('.hero__links .social-links a');
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
  // A site opens in a new tab. An email or a phone number stays on the page,
  // which hands it to the right app, without leaving an empty tab behind:
  // in the top, the menu, the contact cards and the footer.
  await expect(social.nth(0)).not.toHaveAttribute('target');
  for (const link of (await social.all()).slice(1)) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await expect(
    page.locator('a[href^="mailto:"][target], a[href^="tel:"][target]'),
  ).toHaveCount(0);
  await expect(page.locator('.site-header__cv')).toHaveAttribute(
    'download',
    'Bruno_Garcia_Resume.pdf',
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

test('valida os campos do formulário de feedback', async ({
  page,
  isMobile,
}) => {
  const sent: (string | null)[] = [];
  await page.route('**/*', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    sent.push(
      new URLSearchParams(route.request().postData() ?? '').get('email'),
    );
    await route.fulfill({ status: 200, body: '' });
  });
  await page.goto('/');
  let dialog = await openFeedbackForm(page);
  // The dialog is named after what it is for.
  await expect(
    page.getByRole('dialog', { name: 'Leave your feedback' }),
  ).toBeVisible();
  const name = dialog.locator('input[name="fullName"]');
  const email = dialog.locator('input[name="email"]');
  const feedback = dialog.locator('textarea[name="feedback"]');
  // On a touch screen the fields read at 16px at least: iOS zooms into a
  // smaller one on focus, and the page stayed zoomed.
  if (isMobile) {
    for (const field of [name, email, feedback]) {
      await expect(field).toHaveCSS('font-size', '16px');
    }
  }
  // Entering a field, or leaving it empty, says nothing before sending.
  await name.focus();
  await email.focus();
  await expect(dialog.getByText('Please, write your name.')).toBeHidden();

  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(dialog.getByText('Please, write your name.')).toBeVisible();
  await expect(dialog.getByText('Please, tell me your email.')).toBeVisible();
  await expect(
    dialog.getByText('Please, give me your feedback.'),
  ).toBeVisible();
  // The first wrong field takes the focus. Screen readers announce the
  // errors as they appear, and each one describes its field, so it is read
  // with it.
  await expect(name).toBeFocused();
  await expect(dialog.getByRole('alert')).toHaveText([
    'Please, write your name.',
    'Please, tell me your email.',
    'Please, give me your feedback.',
  ]);
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription('Please, write your name.');
  await expect(feedback).toHaveAccessibleDescription(
    'Please, give me your feedback.',
  );

  await email.fill('email-invalido');
  await expect(dialog.getByText('Please, tell me your email.')).toBeVisible();
  await email.fill('visitante@example.com');
  await expect(dialog.getByText('Please, tell me your email.')).toBeHidden();
  await expect(email).not.toHaveAttribute('aria-invalid');

  await dialog.getByRole('button', { name: 'Close' }).last().click();
  await expect(dialog).toBeHidden();

  // The form opens again empty, without the last errors.
  dialog = await openFeedbackForm(page);
  await expect(name).toHaveValue('');
  await expect(dialog.getByText('Please, write your name.')).toBeHidden();

  // A wrong email is not sent, and only the form's message, in the page's
  // language, describes it: the browser doesn't add one of its own.
  await name.fill('Visitante de Teste');
  await email.fill('email-invalido');
  await feedback.fill('Gostei muito do portfólio.');
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(email).toBeFocused();
  await expect(email).toHaveAccessibleDescription(
    'Please, tell me your email.',
  );
  await expect(dialog).toBeVisible();
  expect(sent).toEqual([]);

  // Once fixed, a single click sends it.
  await email.fill('visitante@example.com');
  await dialog.getByRole('button', { name: 'Send' }).click();
  await expect(dialog).toBeHidden();
  expect(sent).toEqual(['visitante@example.com']);
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
    'Page Not Found | Bruno Garcia — Full-Stack Software Engineer',
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
  expect(await pageOverflow(page)).toBeLessThanOrEqual(0);

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
  // Every section, every dialog and the form, one after the other, take
  // most of the default timeout.
  test.slow();
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
  await page.locator('#courses .course__button').first().click();
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

test('abre o painel de conteúdo em /admin', async ({ page, request }) => {
  const response = await request.get('/admin');
  expect(response.status()).toBe(200);
  // The panel has its own policy, which lets it reach GitHub. The site keeps
  // the strict one.
  const panelPolicy = response.headers()['content-security-policy'];
  expect(panelPolicy).toContain('https://api.github.com');
  // Images uploaded in the panel are read from blob: URLs.
  expect(panelPolicy).toMatch(/connect-src [^;]*blob:/);
  expect(panelPolicy).toContain("frame-ancestors 'none'");
  expect(response.headers()['x-frame-options']).toBe('DENY');
  const sitePolicy = (await request.get('/')).headers()[
    'content-security-policy'
  ];
  expect(sitePolicy).not.toContain('api.github.com');
  expect(sitePolicy).not.toContain('unsafe-eval');
  expect(await (await request.get('/robots.txt')).text()).toContain(
    'Disallow: /admin',
  );

  // Decap checks the whole configuration before it shows the login.
  await page.goto('/admin');
  await expect(
    page.getByRole('button', { name: 'Entrar com o GitHub' }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow',
  );
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
    'Bruno Garcia — Full-Stack Software Engineer',
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
    jobTitle: 'Full-Stack Software Engineer',
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

  // The game's page, shared, shows the same image, under its whole title.
  await page.goto('/play');
  const gameTitle = 'Play | Bruno Garcia — Full-Stack Software Engineer';
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    gameTitle,
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    'content',
    gameTitle,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    new RegExp(`^${siteUrl}/opengraph-image`),
  );
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
