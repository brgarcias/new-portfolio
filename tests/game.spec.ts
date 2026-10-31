import { readFile } from 'node:fs/promises';
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
  return page.evaluate(
    ([codes, ms]) =>
      new Promise<number>((done) => {
        const hud = document.querySelector<HTMLElement>('.hud');
        const send = (type: string) => {
          for (const code of codes) {
            document.body.dispatchEvent(
              new KeyboardEvent(type, { code, bubbles: true }),
            );
          }
        };
        // The HUD's speed, read every frame: the highest one shown while
        // the keys are held, and a moment after.
        let fastest = 0;
        const watch = () => {
          fastest = Math.max(fastest, Number(hud?.dataset.speed ?? 0));
          frame = requestAnimationFrame(watch);
        };
        let frame = requestAnimationFrame(watch);
        send('keydown');
        setTimeout(() => {
          send('keyup');
          setTimeout(() => {
            cancelAnimationFrame(frame);
            done(fastest);
          }, 300);
        }, ms);
      }),
    [Array.isArray(codes) ? codes : [codes], ms] as const,
  );
}

// Turns the ship with a key until the HUD shows its heading past a target,
// checked every frame in the page: the key goes up on the first frame past
// it, so neither a slow command from the test nor a late timer can carry
// the turn much further.
async function steer(page: Page, code: 'KeyA' | 'KeyD', target: number) {
  await page.evaluate(
    ([code, target]) =>
      new Promise<void>((done, fail) => {
        const hud = document.querySelector<HTMLElement>('.hud');
        const send = (type: string) =>
          document.body.dispatchEvent(
            new KeyboardEvent(type, { code, bubbles: true }),
          );
        const started = performance.now();
        const check = () => {
          const heading = Number(hud?.dataset.heading);
          const past = code === 'KeyD' ? heading <= target : heading >= target;
          if (past || performance.now() - started > 20_000) {
            send('keyup');
            if (past) done();
            else fail(new Error(`The heading stayed at ${heading}.`));
            return;
          }
          requestAnimationFrame(check);
        };
        send('keydown');
        requestAnimationFrame(check);
      }),
    [code, target] as const,
  );
}

// Whether two boxes on the screen meet.
type Box = { x: number; y: number; width: number; height: number };
const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

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
  // Taking off is in sight on every screen, pinned to the bottom on the
  // smaller ones.
  await expect(page.getByRole('button', { name: /Take off/ })).toBeInViewport();
  // Tab reaches the chosen ship before the take-off button.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('radio', { name: 'X-wing' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /Take off/ })).toBeFocused();
  // The roster: six ships, as radio buttons, the first one chosen.
  const ships = page.getByRole('radio');
  await expect(ships).toHaveCount(6);
  await expect(page.locator('.hangar__ship-name')).toHaveText(shipNames);
  await expect(ships.first()).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.hangar__canvas canvas')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to the portfolio' }),
  ).toHaveAttribute('href', '/');

  const falcon = page.getByRole('radio', { name: 'Millennium Falcon' });
  await falcon.click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveText(
    'Millennium Falcon',
  );
  // Its sheet: the model, the class and the maker, and four figures.
  const sheet = page.locator('.hangar__spec');
  await expect(sheet).toContainText('YT-1300f');
  await expect(sheet).toContainText('Light freighter');
  await expect(sheet).toContainText('Corellian Engineering Corporation');
  await expect(sheet.locator('.stat')).toHaveCount(4);
  // The arrows, End, Home and the numbers move through the roster.
  await falcon.press('ArrowRight');
  const awing = page.getByRole('radio', { name: 'A-wing' });
  await expect(awing).toHaveAttribute('aria-checked', 'true');
  await expect(awing).toBeFocused();
  await page.keyboard.press('End');
  await expect(
    page.getByRole('radio', { name: 'Naboo N-1 starfighter' }),
  ).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Home');
  await expect(page.getByRole('radio', { name: 'X-wing' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.keyboard.press('3');
  await expect(falcon).toHaveAttribute('aria-checked', 'true');
  // The choice waits in the hangar on the next visit, and Enter takes off.
  await page.reload();
  await expect(falcon).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(page.locator('.hud__ship')).toHaveText('Millennium Falcon');
  expect(errors).toEqual([]);
});

test('decola numa sequência de lançamento, ou na hora com menos movimento', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
  // The page's clock is the test's: once it stops, the launch waits for
  // the test to move time on.
  await page.clock.install();
  await page.goto('/play');
  await expect(page.locator('.hangar__canvas canvas')).toBeVisible();
  await page.clock.pauseAt(new Date(Date.now() + 2000));
  const xwing = page.getByRole('radio', { name: 'X-wing' });
  await xwing.focus();
  await page.keyboard.press('Enter');
  // The launch plays: the button says so and answers no more, and the
  // flight waits for the ship to be gone.
  const launching = page.getByRole('button', { name: /Launching/ });
  await expect(launching).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.hangar')).toHaveAttribute('data-launching', '');
  // The ship that leaves is the one that flies: the numbers and the
  // arrows pick no other one meanwhile.
  await page.keyboard.press('2');
  await page.keyboard.press('ArrowRight');
  await expect(xwing).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.hud')).toHaveCount(0);
  await page.clock.runFor(1200);
  await expect(page.locator('.hud')).toBeVisible();
  await expect(page.locator('.hud__ship')).toHaveText('X-wing');
  // With less motion, back to the hangar and off again, at once.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Change ship' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Choose your ship',
  );
  await page.getByRole('button', { name: /Take off/ }).click();
  await expect(page.locator('.hud')).toBeVisible();
});

test('chega do hiperespaço e desce até a nave, ou começa atrás dela com menos movimento', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
  await page.goto('/play');
  await page.getByRole('button', { name: 'Take off' }).click();
  // Out of hyperspace, the camera comes down from high over the platform
  // to its place behind the ship, and the arrival ends by itself.
  const hud = page.locator('.hud');
  await expect(hud).toHaveAttribute('data-arriving', '', { timeout: 20_000 });
  await expect(hud).not.toHaveAttribute('data-arriving', { timeout: 30_000 });
  // With less motion, the flight starts behind the ship.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Change ship' }).click();
  await page.getByRole('button', { name: 'Take off' }).click();
  await expect
    .poll(() => reading(page, 'time'), { timeout: 20_000 })
    .toBeGreaterThan(0.5);
  await expect(hud).not.toHaveAttribute('data-arriving');
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
  // A drag up or down tilts it the way the pointer goes: down, its top
  // turns toward the camera.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.7, {
    steps: 8,
  });
  await page.mouse.up();
  await expect
    .poll(() => stage.getAttribute('data-pitch').then(Number))
    .toBeGreaterThan(0.3);
  await expect
    .poll(() => stage.getAttribute('data-top').then(Number))
    .toBeGreaterThan(0.5);
});

test('abre o mapa pelo radar e pela tecla M', async ({ page, isMobile }) => {
  // Many steps over the 3D flight, each of which can take a second on CI's
  // software renderer.
  test.slow();
  await takeOff(page);
  await page.getByRole('button', { name: 'Open the navigation chart' }).click();
  const map = page.getByRole('dialog', { name: 'Navigation chart' });
  await expect(map).toBeVisible();
  // The seven planets, named, with their sections, none opened yet, and
  // the ship on it.
  await expect(map.locator('.chart__name')).toHaveCount(7);
  await expect(map.locator('.chart__name').first()).toHaveText('Tatooine');
  const legend = map.locator('.game-map__legend li');
  await expect(legend).toHaveCount(7);
  await expect(legend.first()).toContainText('About Me');
  await expect(legend.first()).toContainText('Unexplored');
  await expect(map.locator('.chart__ship')).toHaveCount(1);
  await expect(map).toContainText('0 of 7 sections');
  // The holocrons hide on the map, none found yet.
  await expect(map.locator('.chart__holocron')).toHaveCount(7);
  await expect(map.locator('.chart__holocron[data-state="found"]')).toHaveCount(
    0,
  );
  await expect(page.locator('.hud__holocrons')).toContainText(
    '0 of 7 holocrons',
  );
  // A destination sets a course, which the pad's waypoint follows; the
  // same destination again clears it.
  const tatooine = map.getByRole('button', {
    name: /^Set a course for Tatooine/,
  });
  await tatooine.click();
  await expect(tatooine).toHaveAttribute('aria-pressed', 'true');
  await expect(tatooine).toContainText('Course set');
  await page.keyboard.press('Escape');
  await expect(map).toBeHidden();
  const waypoint = page.locator('.game__label[data-course]');
  await expect(waypoint).toHaveCount(1);
  await expect(waypoint).toContainText('Tatooine');
  await page.getByRole('button', { name: 'Open the navigation chart' }).click();
  await tatooine.click();
  await expect(tatooine).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Escape');
  await expect(map).toBeHidden();
  await expect(waypoint).toHaveCount(0);
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

test('guarda a missão para a próxima visita e recomeça só depois de confirmar', async ({
  page,
  isMobile,
}) => {
  test.slow();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // An earlier visit landed on About Me, recovered two holocrons and read
  // the first record.
  await page.addInitScript(() =>
    localStorage.setItem(
      'progress',
      JSON.stringify({
        version: 1,
        visited: ['about'],
        found: ['about', 'experience'],
        read: ['about'],
      }),
    ),
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await takeOff(page);
  await expect(page.locator('.hud__count')).toContainText('1 of 7 sections');
  await expect(page.locator('.hud__holocrons')).toContainText(
    '2 of 7 holocrons',
  );
  // A returning pilot is not briefed again.
  await expect(page.locator('.toast[data-kind="briefing"]')).toHaveCount(0);
  // The archive opens on the record that is new since then.
  await page
    .getByRole('button', { name: 'Open the holocron archive (1 new)' })
    .click();
  const archive = page.getByRole('dialog', { name: 'Holocron archive' });
  await expect(archive).toBeVisible();
  await expect(archive.getByRole('article')).toHaveCount(7);
  const fresh = archive.getByRole('article', {
    name: 'From a PHP monolith to microservices',
  });
  await expect(fresh).toBeFocused();
  await expect(fresh).toContainText('New');
  await expect(
    archive.getByRole('article', { name: 'Full-stack, backend first' }),
  ).toContainText('Open on the site');
  await expect(
    archive.getByRole('heading', { level: 3, name: 'Locked record' }),
  ).toHaveCount(5);
  // A locked record sets a course for its planet.
  const dagobah = archive.getByRole('button', {
    name: 'Set a course for Dagobah',
  });
  await dagobah.click();
  await expect(dagobah).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(archive).toBeHidden();
  await expect(page.locator('.game__label[data-course]')).toContainText(
    'Dagobah',
  );
  // Read now: nothing is new any more. On a keyboard, H opens it too.
  const archiveButton = page.getByRole('button', {
    name: 'Open the holocron archive',
    exact: true,
  });
  if (isMobile) await archiveButton.click();
  else await page.keyboard.press('KeyH');
  await expect(archive).toBeVisible();
  // Starting over asks first, and the safe answer keeps everything.
  await archive.getByRole('button', { name: 'New exploration' }).click();
  const keep = archive.getByRole('button', { name: 'Keep my progress' });
  await expect(keep).toBeFocused();
  await keep.click();
  await expect(
    archive.getByRole('button', { name: 'New exploration' }),
  ).toBeFocused();
  await expect(page.locator('.hud__holocrons')).toContainText(
    '2 of 7 holocrons',
  );
  await archive.getByRole('button', { name: 'New exploration' }).click();
  await archive
    .getByRole('button', { name: 'Start over', exact: true })
    .click();
  await expect(archive).toBeHidden();
  await expect(page.locator('.hud__holocrons')).toContainText(
    '0 of 7 holocrons',
  );
  await expect(page.locator('.hud__count')).toContainText('0 of 7 sections');
  // The mission begins again, and so will the next visit.
  await expect(page.locator('.toast[data-kind="briefing"]')).toContainText(
    'Mission: recover the archive',
  );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('progress') ?? '{}'),
    ),
  ).toMatchObject({ visited: [], found: [], read: [] });
  expect(errors).toEqual([]);
});

test('lê uma seção pela carta sem pousar nem contar a visita', async ({
  page,
}) => {
  test.slow();
  await takeOff(page);
  // A new exploration begins with the mission, once the ship has arrived.
  await expect(page.locator('.toast[data-kind="briefing"]')).toContainText(
    'Mission: recover the archive',
    { timeout: 15_000 },
  );
  const x = await reading(page, 'x');
  const z = await reading(page, 'z');
  await page.getByRole('button', { name: 'Open the navigation chart' }).click();
  const map = page.getByRole('dialog', { name: 'Navigation chart' });
  await map
    .getByRole('button', {
      name: 'Read Coruscant, Professional Experience without landing',
    })
    .click();
  await expect(map).toBeHidden();
  const section = page.getByRole('dialog', {
    name: 'Professional Experience',
  });
  await expect(section).toBeVisible();
  await expect(section).toContainText('Remote access');
  await page.keyboard.press('Escape');
  await expect(section).toBeHidden();
  // The ship stayed where it was, and Coruscant is still unexplored.
  expect(await reading(page, 'x')).toBeCloseTo(x, 1);
  expect(await reading(page, 'z')).toBeCloseTo(z, 1);
  await expect(page.locator('.hud__count')).toContainText('0 of 7 sections');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('progress') ?? '{}').visited,
    ),
  ).toEqual([]);
});

test('aproveita de um progresso salvo só o que reconhece', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // A save from another version, with a repeated holocron, an unknown one,
  // a list that is not a list and a record read without its holocron.
  await page.addInitScript(() =>
    localStorage.setItem(
      'progress',
      JSON.stringify({
        version: 9,
        found: ['about', 'about', 'nowhere', 42],
        visited: 'contact',
        read: ['contact', 'about'],
      }),
    ),
  );
  await takeOff(page);
  await expect(page.locator('.hud__holocrons')).toContainText(
    '1 of 7 holocrons',
  );
  await expect(page.locator('.hud__count')).toContainText('0 of 7 sections');
  await expect(
    page.getByRole('button', {
      name: 'Open the holocron archive',
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('joga com o progresso ilegível ou sem armazenamento', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
  test.slow();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // A save cut in the middle starts a new exploration.
  await page.addInitScript(() =>
    localStorage.setItem('progress', '{"found": ["about"'),
  );
  await takeOff(page);
  await expect(page.locator('.hud__holocrons')).toContainText(
    '0 of 7 holocrons',
  );
  // And a browser that refuses the storage still plays, only forgetting.
  // The first flight closes first: two flights at once share the software
  // renderer and slow each other down.
  await page.close();
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('The storage is not available.');
      },
    }),
  );
  const closed = await context.newPage();
  closed.on('pageerror', (error) => errors.push(error.message));
  await takeOff(closed);
  await expect(closed.locator('.hud__holocrons')).toContainText(
    '0 of 7 holocrons',
  );
  await context.close();
  expect(errors).toEqual([]);
});

test('liga o som e entra no modo foto', async ({ page, isMobile }) => {
  // Many steps over the 3D flight, each of which can take a second on CI's
  // software renderer.
  test.slow();
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
  const photo = await download;
  expect(photo.suggestedFilename()).toMatch(/^portfolio-.*\.png$/);
  // At the canvas's own resolution, whatever the frames: the width in the
  // PNG's header is at least the page's.
  const png = await readFile((await photo.path())!);
  expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.getByRole('button', { name: 'Leave photo mode' }).click();
  await expect(page.locator('.hud__top')).toBeVisible();
  if (isMobile) return;
  // P enters it, Escape leaves it.
  await page.keyboard.press('KeyP');
  await expect(page.locator('.hud__top')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('.hud__top')).toBeVisible();
});

test('cala os motores no hangar e quando a página some', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
  test.slow();
  // The sound is on from the start, and the page's audio is watched: its
  // context and every volume in it, the first one being the master's.
  await page.addInitScript(() => {
    localStorage.setItem('sound', 'on');
    const gains: GainNode[] = [];
    const contexts: AudioContext[] = [];
    Object.assign(window, { gains, contexts });
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
      createGain() {
        const node = super.createGain();
        gains.push(node);
        return node;
      }
    };
  });
  const loudest = () =>
    page.evaluate(() =>
      Math.max(
        ...(window as unknown as { gains: GainNode[] }).gains
          .slice(1)
          .map((node) => node.gain.value),
      ),
    );
  const state = () =>
    page.evaluate(
      () =>
        (window as unknown as { contexts: AudioContext[] }).contexts[0]?.state,
    );
  await takeOff(page);
  // In flight, the engines hum.
  await expect.poll(loudest).toBeGreaterThan(0.04);
  // Back in the hangar, they die down, the wind too.
  await page.getByRole('button', { name: 'Change ship' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Choose your ship',
  );
  await expect.poll(loudest).toBeLessThan(0.005);
  // A hidden page makes no sound, and the sound comes back with the page.
  const hide = (hidden: boolean) =>
    page.evaluate((hidden) => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => hidden,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  await hide(true);
  await expect.poll(state).toBe('suspended');
  await hide(false);
  await expect.poll(state).toBe('running');
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
  await expect(page.locator('.hud__hint')).toContainText('Fly');
  await expect(page.locator('.hud__hint')).toContainText('Shift');
  // Every notice over the flight, and every planet's title, as they come.
  await page.evaluate(() => {
    const log: string[] = [];
    const titles: string[] = [];
    Object.assign(window, { notices: log, titles });
    new MutationObserver((changes) => {
      for (const change of changes) {
        for (const node of change.addedNodes) log.push(node.textContent ?? '');
      }
    }).observe(document.querySelector('.toasts')!, { childList: true });
    new MutationObserver((changes) => {
      for (const change of changes) {
        for (const node of change.addedNodes) {
          const name = (node as HTMLElement).querySelector(
            '.planet-title__name',
          );
          titles.push(name?.textContent ?? '');
        }
      }
    }).observe(document.querySelector('.planet-titles')!, {
      childList: true,
    });
  });
  const titles = () =>
    page.evaluate(() => (window as unknown as { titles: string[] }).titles);

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
  await expect(page.locator('.hud__pad')).toContainText('About Me', {
    timeout: 20_000,
  });
  await expect(page.locator('.hud__pad')).toContainText('Landing zone');
  const about = page.getByRole('dialog', { name: 'About Me' });
  await expect(about).toBeVisible({ timeout: 10_000 });
  await expect(about).toContainText(
    'Passionate and experienced Full Stack Developer',
  );
  await expect(about).toContainText('Tatooine');
  // The holocron on the way in was recovered, and said so.
  expect(
    await page.evaluate(() =>
      (window as unknown as { notices: string[] }).notices.join(' '),
    ),
  ).toContain('Holocron recovered');
  await expect(page.locator('.hud__holocrons')).toContainText(
    '1 of 7 holocrons',
  );
  // It unlocked the planet's record, and the next visit will find the
  // holocron and the section where this one left them.
  expect(
    await page.evaluate(() =>
      (window as unknown as { notices: string[] }).notices.join(' '),
    ),
  ).toContain('New record: Full-stack, backend first');
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('progress') ?? '{}'),
    ),
  ).toMatchObject({ visited: ['about'], found: ['about'] });
  // Tatooine's title came up as the ship entered it.
  expect(await titles()).toEqual(['Tatooine']);
  await expect(
    about.getByRole('link', { name: 'Open on the site' }),
  ).toHaveAttribute('href', '/#about');
  await expect(page.locator('.hud__count')).toContainText('1 of 7 sections');
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
  await expect(page.locator('.hud__pad')).toContainText('About Me');
  await expect(page.locator('.hud__pad')).toHaveAttribute(
    'data-phase',
    'landed',
  );

  // A turn all the way round, back the way it came, so the ship points
  // down the lane, which is clear; the page lets go of the key on the
  // first frame past the target, so it aims a little short of the full
  // turn and ends within a frame's turn of it. On CI's software renderer
  // one frame can take most of a second and carry the turn well past its
  // mark, so a short turn the other way brings it back.
  // Then a burst of boost down the lane, past the top speed, which the
  // page reads every frame, so a slow machine cannot miss the peak.
  await expect
    .poll(() => reading(page, 'speed'), { timeout: 10_000 })
    .toBeLessThan(0.1);
  const heading = await reading(page, 'heading');
  const back = heading - Math.PI;
  await steer(page, 'KeyD', back + 0.15);
  for (let correction = 0; correction < 3; correction++) {
    const now = await reading(page, 'heading');
    if (Math.abs(now - back) < 0.35) break;
    if (now < back) await steer(page, 'KeyA', back - 0.1);
    else await steer(page, 'KeyD', back + 0.1);
  }
  const turned = await reading(page, 'heading');
  // A long turn happened, and it ended facing back down the lane.
  expect(heading - turned).toBeGreaterThan(2.5);
  expect(Math.abs(turned - back)).toBeLessThan(0.6);
  const fastest = await hold(page, ['KeyW', 'ShiftLeft'], 1800);
  expect(fastest).toBeGreaterThan(27);
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
  // Each planet's title came up once, the first time in it.
  const seen = await titles();
  expect(seen[0]).toBe('Tatooine');
  expect(new Set(seen).size).toBe(seen.length);
  await page.getByRole('button', { name: 'Change ship' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Choose your ship',
  );
  expect(errors).toEqual([]);
});

test.describe('no tablet', () => {
  test.use({
    viewport: { width: 820, height: 1180 },
    hasTouch: true,
    isMobile: true,
  });

  test('deixa os controles de toque livres dos painéis do HUD', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
    // Taking off is in sight in the stacked hangar, without scrolling.
    await page.goto('/play');
    await expect(
      page.getByRole('button', { name: /Take off/ }),
    ).toBeInViewport();
    await takeOff(page);
    const boost = (await page
      .getByRole('button', { name: 'Boost' })
      .boundingBox())!;
    const joystick = (await page
      .getByRole('slider', { name: 'Joystick' })
      .boundingBox())!;
    const craft = (await page.locator('.hud__craft').boundingBox())!;
    expect(overlap(boost, craft)).toBe(false);
    expect(overlap(joystick, craft)).toBe(false);
  });
});

test.describe('no celular deitado', () => {
  test.use({
    viewport: { width: 750, height: 342 },
    hasTouch: true,
    isMobile: true,
  });

  test('cabe o hangar, o HUD e a carta na tela baixa', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
    test.slow();
    // The ship and taking off are in sight, without scrolling.
    await page.goto('/play');
    await expect(page.locator('.hangar__stage')).toBeInViewport({
      ratio: 0.5,
    });
    await expect(
      page.getByRole('button', { name: /Take off/ }),
    ).toBeInViewport();
    await takeOff(page);
    // The HUD keeps to the edges: all of its pieces are on the screen,
    // and no two of them meet.
    const pieces = {
      back: page.locator('.hud__back'),
      swap: page.locator('.hud__swap'),
      log: page.locator('.hud__log'),
      tools: page.locator('.hud__tools'),
      radar: page.locator('.radar-button'),
      place: page.locator('.hud__locator'),
      boost: page.getByRole('button', { name: 'Boost' }),
      joystick: page.getByRole('slider', { name: 'Joystick' }),
    };
    const boxes: [string, Box][] = [];
    for (const [name, piece] of Object.entries(pieces)) {
      const box = (await piece.boundingBox())!;
      expect(box.y + box.height, name).toBeLessThanOrEqual(342);
      expect(box.x + box.width, name).toBeLessThanOrEqual(750);
      boxes.push([name, box]);
    }
    for (const [i, [name, box]] of boxes.entries()) {
      for (const [other, next] of boxes.slice(i + 1)) {
        expect(overlap(box, next), `${name} and ${other}`).toBe(false);
      }
    }
    // The chart sits beside its destinations, all of it on the screen.
    await page.locator('.radar-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const chart = (await page.locator('.game-map__chart').boundingBox())!;
    const side = (await page.locator('.game-map__side').boundingBox())!;
    expect(overlap(chart, side)).toBe(false);
    expect(chart.y + chart.height).toBeLessThanOrEqual(342);
  });
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
  await expect(page.locator('.hud__pad')).toContainText('About Me', {
    timeout: 20_000,
  });
  const about = page.getByRole('dialog', { name: 'About Me' });
  await expect(about).toBeVisible({ timeout: 10_000 });
  // Both of its footer's buttons are whole on the phone's screen.
  await expect(
    about.getByRole('button', { name: /Back to the flight/ }),
  ).toBeInViewport({ ratio: 1 });
  await expect(
    about.getByRole('link', { name: 'Open on the site' }),
  ).toBeInViewport({ ratio: 1 });
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
