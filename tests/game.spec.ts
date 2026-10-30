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

// Holds a key for a while, timed by the page's own clock: on a slow machine a
// command from the test can arrive late and keep the thrust on past the pad.
// The game reads the key's code as it bubbles up to the window.
async function hold(page: Page, codes: string | string[], ms: number) {
  await page.evaluate(
    ([codes, ms]) =>
      new Promise<void>((done) => {
        const send = (type: string) => {
          for (const code of codes) {
            document.body.dispatchEvent(
              new KeyboardEvent(type, { code, bubbles: true }),
            );
          }
        };
        send('keydown');
        setTimeout(() => {
          send('keyup');
          done();
        }, ms);
      }),
    [Array.isArray(codes) ? codes : [codes], ms] as const,
  );
}

async function takeOff(page: Page) {
  await page.goto('/play');
  await page.getByRole('button', { name: 'Take off' }).click();
  await expect(page.locator('.hud')).toBeVisible();
  await expect(page.locator('.game canvas')).toBeVisible();
  // The flight is on once its clock runs: the first frames compile the
  // shaders, which takes a while on a software renderer.
  await expect
    .poll(() => reading(page, 'time'), { timeout: 20_000 })
    .toBeGreaterThan(0.5);
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

test('gira a nave no hangar ao arrastar', async ({ page }) => {
  await page.goto('/play');
  const stage = page.locator('.hangar__stage');
  await expect(stage).toContainText('Drag to turn the ship');
  const box = (await stage.boundingBox())!;
  const before = Number(await stage.getAttribute('data-yaw'));
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  // The drag turned it, well past what the slow turn would have done.
  await expect
    .poll(() => stage.getAttribute('data-yaw').then(Number))
    .toBeGreaterThan(before + 1);
  // A drag up or down tilts it.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7, {
    steps: 8,
  });
  await page.mouse.up();
  await expect
    .poll(() => stage.getAttribute('data-pitch').then(Number))
    .toBeGreaterThan(0.3);
});

test('abre o mapa pelo radar e pela tecla M', async ({ page, isMobile }) => {
  await takeOff(page);
  await page.getByRole('button', { name: 'Open the map' }).click();
  const map = page.getByRole('dialog', { name: 'Map' });
  await expect(map).toBeVisible();
  // The seven planets, named, with their sections, none opened yet, and
  // the ship on it.
  await expect(map.locator('.radar__name')).toHaveCount(7);
  await expect(map.locator('.radar__name').first()).toHaveText('Tatooine');
  const legend = map.locator('.game-map__legend li');
  await expect(legend).toHaveCount(7);
  await expect(legend.first()).toContainText('About Me');
  await expect(legend.first()).toContainText('Not opened yet');
  await expect(map.locator('.radar__ship')).toHaveCount(1);
  await expect(map).toContainText('0 of 7 sections');
  // The holocrons hide on the map, none found yet.
  await expect(map.locator('.radar__holocron')).toHaveCount(7);
  await expect(map.locator('.radar__holocron[data-state="found"]')).toHaveCount(
    0,
  );
  await expect(page.locator('.hud__holocrons')).toHaveText('0 of 7 holocrons');
  await page.keyboard.press('Escape');
  await expect(map).toBeHidden();
  if (isMobile) return;
  // M opens and closes it, and the keys do not fly the ship meanwhile.
  await page.keyboard.press('KeyM');
  await expect(map).toBeVisible();
  await page.keyboard.press('KeyW');
  await page.waitForTimeout(400);
  expect(await reading(page, 'speed')).toBe(0);
  await page.keyboard.press('KeyM');
  await expect(map).toBeHidden();
});

test('liga o som e entra no modo foto', async ({ page, isMobile }) => {
  await takeOff(page);
  // The sounds come on with their button, and the choice is kept.
  await page.getByRole('button', { name: 'Sound off' }).click();
  await expect(page.getByRole('button', { name: 'Sound on' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await page.evaluate(() => localStorage.getItem('sound'))).toBe('on');
  // Photo mode leaves only the picture, and saves it.
  await page.getByRole('button', { name: 'Photo mode' }).click();
  await expect(page.locator('.hud__top')).toBeHidden();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save photo' }).click();
  expect((await download).suggestedFilename()).toMatch(/^portfolio-.*\.png$/);
  await page.getByRole('button', { name: 'Leave photo mode' }).click();
  await expect(page.locator('.hud__top')).toBeVisible();
  if (isMobile) return;
  // P enters it, Escape leaves it.
  await page.keyboard.press('KeyP');
  await expect(page.locator('.hud__top')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('.hud__top')).toBeVisible();
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

  // Two and a half seconds of thrust: the ship picks up speed and moves
  // ahead, towards -Z. Straight ahead lies the first pad, About Me; the
  // thrust goes off well before it, as a pilot would, the ship coasts in,
  // the pad catches it, and once it stops there the section opens over the
  // flight. Timed, not read from the page: on CI's software renderer each
  // command to the page can take a second, and the pad catches the ship
  // whether the thrust goes off a second early or a second late.
  await hold(page, 'KeyW', 2500);
  // Read by position, not speed: on a slow machine the pad may have caught
  // the ship before the first reading.
  await expect.poll(() => reading(page, 'z')).toBeLessThan(-5);
  await expect(page.locator('.hud__pad')).toContainText(
    'Landing pad: About Me',
    { timeout: 20_000 },
  );
  const about = page.getByRole('dialog', { name: 'About Me' });
  await expect(about).toBeVisible({ timeout: 10_000 });
  await expect(about).toContainText(
    'Passionate and experienced Full Stack Developer',
  );
  await expect(
    about.getByRole('link', { name: 'Open on the site' }),
  ).toHaveAttribute('href', '/#about');
  await expect(page.locator('.hud__count')).toHaveText('1 of 7 sections');
  // The radar shows the sectors and the pads, and the one the ship is on;
  // the pad lies on its planet, which the HUD and its label name.
  await expect(page.locator('.radar .radar__sector')).toHaveCount(7);
  await expect(page.locator('.radar .radar__pad')).toHaveCount(7);
  await expect(page.locator('.radar [data-state="active"]')).toHaveCount(1);
  await expect(
    page.locator('.hud__planet').filter({ visible: true }),
  ).toHaveText(/Tatooine/);
  await expect(page.locator('.game__label').first()).toContainText('Tatooine');
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

  // A turn all the way round, back the way it came, timed by the page at
  // the slow turn of a ship at rest, so it points down the lane, which is
  // clear; then a burst of boost down it, past the top speed. The reading
  // keeps the highest speed seen, because a slow machine could miss the
  // peak.
  await hold(page, 'KeyD', 3550);
  const heading = await reading(page, 'heading');
  expect(Math.abs(Math.abs(heading) - Math.PI)).toBeLessThan(0.45);
  let fastest = 0;
  const burst = hold(page, ['KeyW', 'ShiftLeft'], 1800);
  await expect
    .poll(
      async () => {
        fastest = Math.max(fastest, await reading(page, 'speed'));
        return fastest;
      },
      { timeout: 10_000 },
    )
    .toBeGreaterThan(27);
  await burst;
  // It coasts, and never leaves the platform.
  await expect
    .poll(() => reading(page, 'speed'), { timeout: 15_000 })
    .toBeLessThan(27);
  const x = await reading(page, 'x');
  const z = await reading(page, 'z');
  expect(Math.hypot(x, z)).toBeLessThan(110);

  // Once it stops, a section may open, if it stopped on a pad; the hangar
  // waits behind it.
  await expect
    .poll(() => reading(page, 'speed'), { timeout: 30_000 })
    .toBeLessThan(0.3);
  if (await page.locator('.hud__pad').textContent()) {
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  }
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
  // The joystick lies under the right thumb and the boost under the left.
  const width = page.viewportSize()!.width;
  expect(centerX).toBeGreaterThan(width / 2);
  const boost = (await page
    .getByRole('button', { name: 'Boost' })
    .boundingBox())!;
  expect(boost.x + boost.width / 2).toBeLessThan(width / 2);
  // Pushes the stick forward for a moment, then lets go well before the
  // first pad: the ship coasts in and lands there.
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX, centerY - 40, { steps: 5 });
  await page.waitForTimeout(2500);
  await page.mouse.up();
  await expect.poll(() => reading(page, 'z')).toBeLessThan(-5);
  await expect(joystick.locator('.joystick__knob')).toHaveAttribute(
    'style',
    '',
  );
  await expect(page.locator('.hud__pad')).toContainText(
    'Landing pad: About Me',
    { timeout: 20_000 },
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
  await expect
    .poll(() => reading(page, 'time'), { timeout: 20_000 })
    .toBeGreaterThan(0.5);
  // The sections open in the page's language too.
  await hold(page, 'KeyW', 2500);
  await expect(page.locator('.hud__pad')).toContainText('Sobre mim', {
    timeout: 20_000,
  });
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
