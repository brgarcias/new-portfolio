import { expect, test, type Page } from '@playwright/test';
import type AxeCore from 'axe-core';
import {
  findSpills,
  pageOverflow,
  sections,
  waitForTransitions,
} from './helpers';

// What the content can break without the build noticing: a text that spills out
// of its card on a phone, a markup left unclosed, a page that fails in the
// browser. The other tests run on a fixed copy of the content, so edits made in
// the panel do not change what they check. On CI, these also run on a build of
// the real content, on every pull request. So they ask nothing about what the
// texts say, and pass on any content that is whole.

const languages = [
  { home: '/', play: '/play', lang: 'en' },
  { home: '/pt', play: '/pt/play', lang: 'pt' },
  { home: '/es', play: '/es/play', lang: 'es' },
];

// What shows when a field is missing or a text was not formatted.
const broken = /\bundefined\b|\bNaN\b|\[object Object\]|Invalid Date|\*\*/;

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const { home, play, lang } of languages) {
  test(`mostra em ${home} todo o conteúdo inteiro e sem erros`, async ({
    page,
    request,
    isMobile,
  }) => {
    const errors = watchErrors(page);
    const response = await page.goto(home);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();

    // Every section, with its title and something under it.
    for (const id of sections) {
      const section = page.locator(`main section#${id}`);
      await expect(section.getByRole('heading').first()).not.toBeEmpty();
      await expect(section).not.toBeEmpty();
    }

    // No text left broken.
    const text = await page.locator('main').innerText();
    expect(text.match(broken)?.[0]).toBeUndefined();

    // Nothing wider than the screen, nor a text wider than its box. A long
    // word in a card would be cut off without the page getting any wider. On
    // the narrowest phones too.
    for (const width of isMobile ? [320, 390] : [1440]) {
      await page.setViewportSize({ width, height: 800 });
      expect(await pageOverflow(page), `${width}px`).toBeLessThanOrEqual(0);
      expect(await findSpills(page, 'main'), `${width}px`).toEqual([]);
    }

    // Every image the content points to exists.
    const images = await page
      .locator('main img')
      .evaluateAll((all) => [
        ...new Set(all.map((image) => image.getAttribute('src'))),
      ]);
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      const file = await request.get(image ?? '');
      expect(file.ok(), `${image}`).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test(`não tem violações de acessibilidade em ${home}`, async ({ page }) => {
    test.slow();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(home);
    // Every block enters as it scrolls into view, and a block still fading in
    // would read as low contrast. Two frames at each one, as the browser only
    // reports what came into view when it draws: on a busy machine, a block
    // passed by in a hurry never entered.
    await page.evaluate(async () => {
      for (const block of document.querySelectorAll(
        'main [style*="opacity"]',
      )) {
        if (block.getClientRects().length === 0) continue;
        block.scrollIntoView({ block: 'center', behavior: 'instant' });
        await new Promise((done) =>
          requestAnimationFrame(() => requestAnimationFrame(done)),
        );
      }
    });
    // What waits behind a button, as the early roles, has not entered.
    await page.waitForFunction(() =>
      [...document.querySelectorAll('main [style*="opacity"]')]
        .filter((block) => block.getClientRects().length > 0)
        .every((block) => getComputedStyle(block).opacity === '1'),
    );
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    const audit = () =>
      page.evaluate(async () => {
        const { axe } = window as unknown as { axe: typeof AxeCore };
        const { violations } = await axe.run(document, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        });
        return violations.map(
          ({ id, nodes }) =>
            `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`,
        );
      });
    expect(await audit(), 'dark theme').toEqual([]);
    // The site follows the system's theme at once.
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveClass(/light/);
    await waitForTransitions(page);
    expect(await audit(), 'light theme').toEqual([]);
  });

  test(`abre o jogo em ${play} com o conteúdo das seções`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
    const errors = watchErrors(page);
    const response = await page.goto(play);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    // The hangar: the sections themselves wait in the page for the landing.
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
    await expect(page.getByRole('radio').first()).toBeVisible({
      timeout: 15_000,
    });
    expect(errors).toEqual([]);
  });
}
