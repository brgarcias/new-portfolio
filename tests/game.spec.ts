import { expect, test, type Page } from '@playwright/test';

// The game at /play: the hangar, the flight and the ways around it. The
// headless Chromium draws its WebGL by software, so it runs in CI too. The
// HUD reports the ship's position, heading and speed in data attributes.

const shipNames = [
  'X-wing',
  'TIE fighter',
  'Millennium Falcon',
  'A-wing',
  'Y-wing',
  'Naboo N-1 starfighter',
];

const reading = (page: Page, name: string) =>
  page.locator('.hud').getAttribute(`data-${name}`).then(Number);

// Brakes until the ship is nearly still, as a pilot does on reaching a pad.
async function brake(page: Page) {
  await page.keyboard.down('KeyS');
  await expect.poll(() => reading(page, 'speed')).toBeLessThan(3);
  await page.keyboard.up('KeyS');
}

async function takeOff(page: Page) {
  await page.goto('/play');
  await page.getByRole('button', { name: 'Take off' }).click();
  await expect(page.locator('.hud')).toBeVisible();
  await expect(page.locator('.game canvas')).toBeVisible();
}

test('abre o hangar com as naves e lembra a escolhida', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/play');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Play | Bruno Garcia — Dev. Full-Stack');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Choose your ship',
  );
  const ships = page.locator('.hangar__ship');
  await expect(ships).toHaveText(shipNames);
  await expect(ships.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.hangar__canvas canvas')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to the portfolio' }),
  ).toHaveAttribute('href', '/');

  await page.getByRole('button', { name: 'Millennium Falcon' }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Millennium Falcon',
  );
  // The choice waits in the hangar on the next visit.
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Millennium Falcon' }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('voa pelo teclado, dá turbo e pousa na primeira plataforma', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Phones fly with the joystick.');
  test.slow();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await takeOff(page);
  await expect(page.locator('.hud__ship')).toHaveText('X-wing');
  await expect(page.locator('.hud__hint')).toContainText('W, A, S, D');

  // Thrust: the ship picks up speed and moves ahead, towards -Z.
  await page.keyboard.down('KeyW');
  await expect
    .poll(() => reading(page, 'speed'), { timeout: 10_000 })
    .toBeGreaterThan(5);
  await expect.poll(() => reading(page, 'z')).toBeLessThan(-5);
  // Straight ahead lies the first pad, About Me. The pad slows the ship
  // down, and once it stops there the section opens over the flight.
  await expect(page.locator('.hud__pad')).toContainText(
    'Landing pad: About Me',
    { timeout: 20_000 },
  );
  await page.keyboard.up('KeyW');
  await brake(page);
  const about = page.getByRole('dialog', { name: 'About Me' });
  await expect(about).toBeVisible({ timeout: 10_000 });
  await expect(about).toContainText(
    'Passionate and experienced Full Stack Developer',
  );
  await expect(
    about.getByRole('link', { name: 'Open on the site' }),
  ).toHaveAttribute('href', '/#about');
  await expect(page.locator('.hud__count')).toHaveText('1 of 7 sections');
  // Keys do not fly the ship while a section is open.
  await page.keyboard.press('KeyW');
  await expect.poll(() => reading(page, 'speed')).toBe(0);
  await page.keyboard.press('Escape');
  await expect(about).toBeHidden();
  // Still on the pad, it does not open again until the ship comes back.
  await page.waitForTimeout(1500);
  await expect(about).toBeHidden();
  await expect(page.locator('.hud__pad')).toContainText(
    'Landing pad: About Me',
  );

  // A turn changes the heading: a long one, back towards the middle of the
  // platform, where there is room for the boost to go past the top speed.
  const heading = await reading(page, 'heading');
  await page.keyboard.down('KeyD');
  await expect
    .poll(() => reading(page, 'heading'), { timeout: 8_000 })
    .toBeLessThan(heading - 2);
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyW');
  await page.keyboard.down('ShiftLeft');
  await expect
    .poll(() => reading(page, 'speed'), { timeout: 10_000 })
    .toBeGreaterThan(27);
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('KeyW');
  // It coasts, and never leaves the platform.
  await expect
    .poll(() => reading(page, 'speed'), { timeout: 15_000 })
    .toBeLessThan(27);
  const x = await reading(page, 'x');
  const z = await reading(page, 'z');
  expect(Math.hypot(x, z)).toBeLessThan(110);

  // Wherever it stopped, a section may have opened.
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Change ship' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Choose your ship',
  );
  expect(errors).toEqual([]);
});

test('voa pelo joystick no celular', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The joystick appears for fingers.');
  await takeOff(page);
  const joystick = page.getByRole('slider', { name: 'Joystick' });
  await expect(joystick).toBeVisible();
  await expect(page.getByRole('button', { name: 'Boost' })).toBeVisible();
  const box = (await joystick.boundingBox())!;
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  // Pushes the stick forward and holds it.
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX, centerY - 40, { steps: 5 });
  await expect
    .poll(() => reading(page, 'speed'), { timeout: 10_000 })
    .toBeGreaterThan(5);
  // Held forward, it reaches the first pad, and lands there once released.
  await expect(page.locator('.hud__pad')).toContainText(
    'Landing pad: About Me',
    { timeout: 20_000 },
  );
  await page.mouse.move(centerX, centerY + 40, { steps: 3 });
  await expect.poll(() => reading(page, 'speed')).toBeLessThan(3);
  await page.mouse.up();
  await expect(joystick.locator('.joystick__knob')).toHaveAttribute(
    'style',
    '',
  );
  const about = page.getByRole('dialog', { name: 'About Me' });
  await expect(about).toBeVisible({ timeout: 10_000 });
  await about.getByRole('button', { name: 'Close' }).click();
  await expect(about).toBeHidden();
});

test('fala a língua da página e leva /en/play para /play', async ({
  page,
  request,
}) => {
  const response = await request.get('/en/play', { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers()['location']).toBe('/play');

  await page.goto('/pt/play');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
  await expect(page).toHaveTitle('Jogar | Bruno Garcia — Dev. Full-Stack');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Escolha sua nave',
  );
  await expect(
    page.getByRole('link', { name: 'Voltar ao portfólio' }),
  ).toHaveAttribute('href', '/pt');
  await expect(
    page.locator('link[rel="alternate"][hreflang="es"]'),
  ).toHaveAttribute('href', /\/es\/play$/);
  await page.getByRole('button', { name: 'Decolar' }).click();
  await expect(page.getByRole('button', { name: 'Trocar nave' })).toBeVisible();
  // The sections open in the page's language too.
  await page.keyboard.down('KeyW');
  await expect(page.locator('.hud__pad')).toContainText('Sobre mim', {
    timeout: 20_000,
  });
  await page.keyboard.up('KeyW');
  await brake(page);
  const sobre = page.getByRole('dialog', { name: 'Sobre mim' });
  await expect(sobre).toBeVisible({ timeout: 10_000 });
  await expect(
    sobre.getByRole('link', { name: 'Abrir no site' }),
  ).toHaveAttribute('href', '/pt#about');

  await page.goto('/es/play');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Elige tu nave',
  );
  expect(await (await request.get('/sitemap.xml')).text()).toContain(
    '/pt/play',
  );
});

test('avisa quando o navegador não desenha 3D', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type.startsWith('webgl')) return null;
      return (getContext as (...args: unknown[]) => unknown).call(
        this,
        type,
        ...rest,
      );
    } as typeof getContext;
  });
  await page.goto('/play');
  await expect(
    page.getByText('This browser cannot draw 3D graphics'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to the portfolio' }),
  ).toHaveAttribute('href', '/');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('mantém a política de segurança do site no jogo', async ({ page }) => {
  await page.addInitScript(() => {
    const violations: string[] = [];
    Object.assign(window, { cspViolations: violations });
    document.addEventListener('securitypolicyviolation', (event) =>
      violations.push(`${event.violatedDirective} ${event.blockedURI}`),
    );
  });
  const response = await page.goto('/play');
  const policy = response!.headers()['content-security-policy'];
  expect(policy).toContain("script-src 'self' 'unsafe-inline'");
  expect(policy).not.toContain('unsafe-eval');
  await page.getByRole('button', { name: 'Take off' }).click();
  await expect(page.locator('.game canvas')).toBeVisible();
  await expect.poll(() => reading(page, 'speed')).toBe(0);
  expect(
    await page.evaluate(
      () => (window as unknown as { cspViolations: string[] }).cspViolations,
    ),
  ).toEqual([]);
});
