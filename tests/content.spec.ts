import { expect, test, type Page } from '@playwright/test';
import { findSpills, pageOverflow, sections } from './helpers';

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
      const section = page.locator(`main > section#${id}`);
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
      // On a wide screen the top's big title may run a little past its column,
      // short of the illustration, as a word like "Desenvolvedor" does.
      const allowed = isMobile ? undefined : '.hero__title-line';
      expect(await findSpills(page, 'main', allowed), `${width}px`).toEqual([]);
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
