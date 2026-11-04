import { readFile } from 'node:fs/promises';
import type AxeCore from 'axe-core';
import {
  expect as baseExpect,
  test,
  type Locator,
  type Page,
} from '@playwright/test';
import {
  gatesOf,
  maxGates,
  plotRoute,
  routeStep,
} from '../src/app/game/flight-plan';
import { voices, type Voice } from '../src/app/game/engines';
import { enteredPlanet, newTitleWatch } from '../src/app/game/titles';
import {
  arena,
  pads,
  padRadius,
  platformRadius,
} from '../src/app/game/world/arena';
import { biomes } from '../src/app/game/world/biomes';

// The game at /play: the hangar, the flight and the ways around it. The
// headless Chromium draws its WebGL by software, so it runs in CI too. The
// HUD reports the ship's position, heading and speed in data attributes.

// CI's software renderer takes its time. Compiling the shaders can hold the page
// for several seconds, above all in the first test of each process, and each
// command to the page can take a second. So every test here gets more time, and
// every check more patience, without asking for anything less: what a check
// waits for still has to happen.
test.describe.configure({ timeout: 90_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

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

// Thrusts straight ahead until the HUD shows the ship past a point, checked
// every frame in the page, and lets go there. Speed and distance go together,
// however slow the frames, so from there the ship always coasts into the first
// pad, which catches it. A burst timed by the clock could come up short when
// the frames stalled, and leave the ship stopped before the pad.
async function thrustPast(page: Page, z: number) {
  await page.evaluate(
    (z) =>
      new Promise<void>((done, fail) => {
        const hud = document.querySelector<HTMLElement>('.hud');
        const send = (type: string) =>
          document.body.dispatchEvent(
            new KeyboardEvent(type, { code: 'KeyW', bubbles: true }),
          );
        const started = performance.now();
        const check = () => {
          const past = Number(hud?.dataset.z) < z;
          if (past || performance.now() - started > 30_000) {
            send('keyup');
            if (past) done();
            else fail(new Error(`The ship stayed at ${hud?.dataset.z}.`));
            return;
          }
          requestAnimationFrame(check);
        };
        send('keydown');
        requestAnimationFrame(check);
      }),
    z,
  );
}

// How far a ship flies before it lets go, on the way to the first pad.
const padApproach = -28;

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

// Waits for the animations that enter once, as a dialog's, to end: a text still
// fading in would read as low contrast. The ones that loop never end.
async function waitForEntrances(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => {
          const iterations = animation.effect?.getTiming().iterations;
          return iterations !== Infinity;
        })
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

// What the page's audio does, watched from before the game starts: what comes out
// of the master, the first volume to be made, its level and how bright it is, the
// loudest since the last reset, the sources running and the tones and the rushes
// of air they were.
interface AudioWatch {
  context: AudioContext | null;
  level: number;
  loudest: number;
  brightness: number;
  running: number;
  rushes: number;
  tones: string[];
}

async function watchAudio(page: Page) {
  await page.addInitScript(() => {
    const watch: AudioWatch = {
      context: null,
      level: 0,
      loudest: 0,
      brightness: 0,
      running: 0,
      rushes: 0,
      tones: [],
    };
    let analyser: AnalyserNode | null = null;
    Object.assign(window, { audioWatch: watch });
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        watch.context = this;
      }
      createGain() {
        const node = super.createGain();
        if (!analyser) {
          analyser = this.createAnalyser();
          analyser.fftSize = 8192;
          analyser.smoothingTimeConstant = 0;
          node.connect(analyser);
        }
        return node;
      }
    };
    // A buffer's source has its own start, with an offset.
    for (const kind of [AudioScheduledSourceNode, AudioBufferSourceNode]) {
      const start = kind.prototype.start as (...args: number[]) => void;
      kind.prototype.start = function (
        this: AudioScheduledSourceNode,
        ...args: number[]
      ) {
        watch.running += 1;
        this.addEventListener('ended', () => {
          watch.running -= 1;
        });
        if (this instanceof OscillatorNode && this.frequency.value >= 20) {
          watch.tones.push(`${this.type}:${Math.round(this.frequency.value)}`);
        }
        if (this instanceof AudioBufferSourceNode && !this.loop) {
          watch.rushes += 1;
        }
        start.apply(this, args);
      };
    }
    // The page measures for itself, because each command to it can take a second
    // on CI's software renderer.
    setInterval(() => {
      if (!analyser || !watch.context) return;
      const wave = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(wave);
      let sum = 0;
      for (const value of wave) sum += value * value;
      watch.level = Math.sqrt(sum / wave.length);
      if (watch.level <= watch.loudest) return;
      watch.loudest = watch.level;
      const bins = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(bins);
      let power = 0;
      let moment = 0;
      bins.forEach((db, bin) => {
        const share = 10 ** (db / 10);
        power += share;
        moment += share * bin;
      });
      watch.brightness =
        ((moment / (power || 1)) * watch.context.sampleRate) / analyser.fftSize;
    }, 60);
  });
  const read = (page: Page) =>
    page.evaluate(() => {
      const { context, ...numbers } = (
        window as unknown as { audioWatch: AudioWatch }
      ).audioWatch;
      return { ...numbers, state: context?.state };
    });
  return {
    level: async () => (await read(page)).level,
    loudest: async () => (await read(page)).loudest,
    brightness: async () => (await read(page)).brightness,
    running: async () => (await read(page)).running,
    rushes: async () => (await read(page)).rushes,
    state: async () => (await read(page)).state,
    // The tones made since the last time they were read.
    tones: () =>
      page.evaluate(() => {
        const watch = (window as unknown as { audioWatch: AudioWatch })
          .audioWatch;
        return watch.tones.splice(0);
      }),
    reset: () =>
      page.evaluate(() => {
        const watch = (window as unknown as { audioWatch: AudioWatch })
          .audioWatch;
        watch.loudest = 0;
        watch.brightness = 0;
      }),
  };
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

test.describe('tema do site', () => {
  // The background of the page, which the theme decides.
  const night = 'rgb(5, 7, 13)';
  const day = 'rgb(238, 241, 249)';

  // Runs axe on what the page shows now. A text over the 3D scene has no
  // background it can read, so it does not count.
  async function audit(page: Page) {
    await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    return page.evaluate(async () => {
      const { axe } = window as unknown as { axe: typeof AxeCore };
      const { violations } = await axe.run(document, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      return violations.map(
        ({ id, nodes }) =>
          `${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`,
      );
    });
  }

  test.describe('claro', () => {
    test.use({ colorScheme: 'light' });

    test('voa de dia e acompanha a troca de tema em pleno voo', async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto('/play');
      const play = page.locator('.play');
      await expect(page.locator('html')).toHaveClass(/light/);
      await expect(play).toHaveCSS('background-color', day);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCSS(
        'color',
        'rgb(13, 21, 48)',
      );
      await page.getByRole('button', { name: 'Take off' }).click();
      const hud = page.locator('.hud');
      await expect(hud).toBeVisible();
      const sky = async () => Number(await hud.getAttribute('data-sky'));
      // By day from the first frame, and not easing out of the night.
      await expect.poll(sky).toBeGreaterThan(0.5);
      await expect(page.locator('.hud__log')).toHaveCSS(
        'color',
        'rgb(13, 21, 48)',
      );

      // The system changes, and the game follows it, the sky easing over.
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(play).toHaveCSS('background-color', night);
      await expect.poll(sky, { timeout: 40_000 }).toBeLessThan(0.2);
      await page.emulateMedia({ colorScheme: 'light' });
      await expect(play).toHaveCSS('background-color', day);
      await expect.poll(sky, { timeout: 40_000 }).toBeGreaterThan(0.5);
      // Nothing in the console, from the rays of the arrival on: their blending
      // by day asks for a setting the renderer complains about without it.
      expect(errors).toEqual([]);
    });

    test('não tem violações de acessibilidade no hangar, na carta, no arquivo e no modo foto', async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
      await page.goto('/play');
      await expect(page.locator('.hangar__canvas canvas')).toBeVisible();
      // What enters at first has entered.
      await waitForEntrances(page);
      expect(await audit(page), 'hangar').toEqual([]);
      await page.getByRole('button', { name: 'Take off' }).click();
      await expect(page.locator('.hud')).toBeVisible();
      await page.keyboard.press('KeyM');
      const chart = page.getByRole('dialog', { name: 'Navigation chart' });
      await expect(chart).toBeVisible();
      await waitForEntrances(page);
      expect(await audit(page), 'chart').toEqual([]);
      // The name of a destination is what it shows, after what it does.
      const tatooine = chart.getByRole('button', {
        name: /^Set a course for Tatooine About Me/,
      });
      await tatooine.click();
      await expect(tatooine).toHaveAttribute('aria-pressed', 'true');
      expect(await audit(page), 'chart with a course').toEqual([]);
      await tatooine.click();
      await page.keyboard.press('Escape');
      await expect(chart).toBeHidden();
      await page.keyboard.press('KeyH');
      const archive = page.getByRole('dialog', { name: 'Holocron archive' });
      await expect(archive).toBeVisible();
      await waitForEntrances(page);
      expect(await audit(page), 'archive').toEqual([]);
      await page.keyboard.press('Escape');
      await expect(archive).toBeHidden();
      // The photo mode: each of its settings, and the photo before it is kept.
      await page.keyboard.press('KeyP');
      await expect(page.locator('.photo')).toBeVisible();
      await waitForEntrances(page);
      expect(await audit(page), 'camera settings').toEqual([]);
      await page.getByRole('button', { name: 'Look', exact: true }).click();
      expect(await audit(page), 'look settings').toEqual([]);
      await page.getByRole('button', { name: 'Frame', exact: true }).click();
      expect(await audit(page), 'frame settings').toEqual([]);
      await page.getByRole('button', { name: 'Take photo' }).click();
      await expect(
        page.getByRole('dialog', { name: 'Your photo' }),
      ).toBeVisible();
      await waitForEntrances(page);
      expect(await audit(page), 'preview').toEqual([]);
    });
  });

  test('segue o tema escolhido no site, em outra aba', async ({
    page,
    context,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
    await page.goto('/play');
    const play = page.locator('.play');
    await expect(play).toHaveCSS('background-color', night);
    const site = await context.newPage();
    await site.goto('/');
    const toggle = site.locator('.site-header .theme-toggle');
    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(play).toHaveCSS('background-color', day);
    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(play).toHaveCSS('background-color', night);
  });

  test('abre no tema guardado, mesmo com o sistema no outro', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto('/play');
    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(page.locator('.play')).toHaveCSS('background-color', day);
  });
});

test('abre o hangar com as naves e lembra a escolhida', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/play');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(
    'Play | Bruno Garcia — Full-Stack Software Engineer',
  );
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Choose your ship',
  );
  // Taking off is in sight on every screen, pinned to the bottom on the
  // smaller ones.
  await expect(page.getByRole('button', { name: /Take off/ })).toBeInViewport();
  // Tab goes through the way back and the sound, and reaches the chosen ship
  // before the take-off button.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Sound off' })).toBeFocused();
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
  // Two flights, one with the whole arrival, each of whose frames can take
  // a second on CI's software renderer.
  await page.goto('/play');
  await page.getByRole('button', { name: 'Take off' }).click();
  // Out of hyperspace, the camera comes down from high over the platform
  // to its place behind the ship, and the arrival ends by itself.
  const hud = page.locator('.hud');
  await expect(hud).toHaveAttribute('data-arriving', '', { timeout: 20_000 });
  // The mission's notice waits for the arrival, not to cover it.
  await expect(page.locator('.toast[data-kind="briefing"]')).toHaveCount(0);
  await expect(hud).not.toHaveAttribute('data-arriving', { timeout: 30_000 });
  await expect(page.locator('.toast[data-kind="briefing"]')).toBeVisible();
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

test('mostra o nome do planeta a cada entrada, sem piscar na fronteira', async ({}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
  const fly = (legs: [Parameters<typeof enteredPlanet>[1], number][]) => {
    const watch = newTitleWatch();
    const shown: string[] = [];
    for (const [sector, seconds] of legs) {
      for (let time = 0; time < seconds; time += 1 / 60) {
        const planet = enteredPlanet(watch, sector, 1 / 60);
        if (planet) shown.push(planet);
      }
    }
    return shown;
  };
  // Each entry, into another planet or back into the same one.
  expect(fly([['about', 1]])).toEqual(['about']);
  expect(
    fly([
      ['hub', 1],
      ['about', 3],
      ['experience', 3],
      ['about', 3],
    ]),
  ).toEqual(['about', 'experience', 'about']);
  expect(
    fly([
      ['about', 3],
      ['hub', 4],
      ['about', 3],
    ]),
  ).toEqual(['about', 'about']);
  // The hub has no title.
  expect(fly([['hub', 5]])).toEqual([]);
  // A moment out of a planet is not leaving it.
  expect(
    fly([
      ['about', 3],
      ['hub', 1],
      ['about', 3],
    ]),
  ).toEqual(['about']);
  // Along a border, one frame on each side, the name does not blink: only the
  // first shows, once the ship has stayed long enough to enter a planet.
  const border = fly([
    ['about', 3],
    ...Array.from(
      { length: 600 },
      (_, frame) =>
        [frame % 2 ? 'about' : 'experience', 1 / 60] as [
          Parameters<typeof enteredPlanet>[1],
          number,
        ],
    ),
  ]);
  expect(border).toEqual(['about']);
});

test('abre o mapa pelo radar e pela tecla M', async ({ page, isMobile }) => {
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

// Whether a piece of the flight plan stays clear of the instruments it would
// hide. All measured in one go: on CI's software renderer each command to the
// page can take a second, and a command per instrument took more than a test
// has.
async function expectClearOfInstruments(piece: Locator, where: string) {
  const met = await piece.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return [
      '.hud__nw > *',
      '.hud__ne > *',
      '.compass',
      '.touch > *',
      '.hud__craft',
      '.hud__hint',
    ].filter((selector) =>
      [...document.querySelectorAll(selector)].some((other) => {
        const area = other.getBoundingClientRect();
        return (
          area.width > 0 &&
          area.height > 0 &&
          box.left < area.right &&
          area.left < box.right &&
          box.top < area.bottom &&
          area.top < box.bottom
        );
      }),
    );
  });
  expect(met, where).toEqual([]);
}

// Sets a course on the chart, by its destination, and flies off with the
// chart's own button.
async function setCourse(page: Page, place: string) {
  await page.getByRole('button', { name: 'Open the navigation chart' }).click();
  const map = page.getByRole('dialog', { name: 'Navigation chart' });
  await map
    .getByRole('button', { name: new RegExp(`^Set a course for ${place}`) })
    .click();
  // The plan shows on the chart at once, with what it holds worked out.
  await expect(map.locator('.chart__course')).toHaveAttribute(
    'points',
    /\d.* .*\d/,
  );
  await expect(map.locator('.flight-plan')).toContainText(place);
  await expect(map.locator('.flight-plan [data-plan="distance"]')).toHaveText(
    /^\d+ m$/,
  );
  const fly = map.getByRole('button', { name: 'Fly this course' });
  await expect(fly).toBeInViewport();
  await fly.click();
  await expect(map).toBeHidden();
}

test('traça rotas que desviam do que é sólido e das outras plataformas', async ({}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
  // A fixed set of places to start from, all over the platform, and the pads
  // themselves, where a flight can pick up again.
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const starts = [
    { x: 0, z: 0 },
    ...pads.map((pad) => ({ x: pad.x, z: pad.z })),
    ...Array.from({ length: 120 }, () => {
      const angle = next() * Math.PI * 2;
      const distance = next() * (platformRadius - 6);
      return { x: Math.sin(angle) * distance, z: Math.cos(angle) * distance };
    }),
  ];
  // The widest ship's radius: a ship that follows the route fits everywhere.
  const widest = 2.8;
  for (const start of starts) {
    for (const pad of pads) {
      const points = plotRoute(start.x, start.z, pad.id);
      const label = `${start.x.toFixed(1)}, ${start.z.toFixed(1)} → ${pad.id}`;
      expect(points[0], label).toEqual(start);
      expect(points.at(-1), label).toEqual({ x: pad.x, z: pad.z });
      let longestStep = 0;
      let farthest = 0;
      let roomFromSolid = Infinity;
      let roomFromPads = Infinity;
      points.forEach((point, index) => {
        if (index) {
          longestStep = Math.max(
            longestStep,
            Math.hypot(
              point.x - points[index - 1].x,
              point.z - points[index - 1].z,
            ),
          );
        }
        // Past the first stretch, which starts wherever the ship is.
        if (index * routeStep < 10) return;
        farthest = Math.max(farthest, Math.hypot(point.x, point.z));
        for (const obstacle of arena.obstacles) {
          roomFromSolid = Math.min(
            roomFromSolid,
            Math.hypot(point.x - obstacle.x, point.z - obstacle.z) - obstacle.r,
          );
        }
        for (const other of pads) {
          if (other.id === pad.id) continue;
          // The pad the ship starts on is the way out.
          if (Math.hypot(start.x - other.x, start.z - other.z) < other.r + 14) {
            continue;
          }
          roomFromPads = Math.min(
            roomFromPads,
            Math.hypot(point.x - other.x, point.z - other.z) - other.r,
          );
        }
      });
      expect(longestStep, label).toBeLessThanOrEqual(routeStep + 0.001);
      expect(farthest, label).toBeLessThan(platformRadius);
      expect(roomFromSolid, label).toBeGreaterThan(widest);
      expect(roomFromPads, label).toBeGreaterThan(0);
      const gates = gatesOf(points);
      expect(gates.length, label).toBeLessThanOrEqual(maxGates);
      expect(
        gates.every(
          (gate) => Math.hypot(gate.x - pad.x, gate.z - pad.z) > padRadius,
        ),
        label,
      ).toBe(true);
    }
  }
  // Around, when there is something in the way, but not the long way around:
  // from the start, each pad is a little more than its straight line away.
  for (const pad of pads) {
    const points = plotRoute(0, 0, pad.id);
    const length = (points.length - 1) * routeStep;
    expect(length, pad.id).toBeLessThan(Math.hypot(pad.x, pad.z) * 1.25);
  }
});

test('projeta o plano de voo sobre o voo, e o desfaz pela faixa', async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await takeOff(page);
  const strip = page.locator('.course-strip');
  const lock = page.locator('.course-lock');
  const named = lock.locator('.course-lock__text');
  const status = page.locator('.hud > [role="status"].g-sr');
  await expect(strip).toHaveCount(0);
  await expect(lock).toHaveCount(0);
  await setCourse(page, 'Tatooine');
  // The strip names where the plan leads, with the distance along the route,
  // the time and the gates, and a screen reader hears it.
  await expect(strip).toBeInViewport({ ratio: 1 });
  await expect(strip).toContainText('Flight plan');
  await expect(strip).toContainText('Tatooine');
  await expect(strip.locator('[data-plan="distance"]')).toHaveText(/^\d+ m$/);
  await expect(strip.locator('[data-plan="time"]')).toHaveText(/^\d+ s$/);
  await expect(strip.locator('[data-plan="gates"]')).toHaveText(/^0\/\d+$/);
  await expect(status).toHaveText('Flight plan to Tatooine, About Me');
  await expect
    .poll(() => reading(page, 'route-gates'))
    .toBeGreaterThanOrEqual(2);
  expect(await reading(page, 'route-length')).toBeGreaterThan(60);
  // The radar shows the route too, on its own layer.
  await expect(page.locator('.radar__route polyline')).toHaveAttribute(
    'points',
    /\d.* .*\d/,
  );
  // The lock names the destination, with the distance, in the picture and
  // clear of the instruments; the pad's own label gives way to it. Tatooine
  // lies straight ahead of the start: on a wide screen the lock stands on its
  // pad, and on a phone, where the instruments cover the horizon, it points
  // up from under them.
  await expect(named).toBeInViewport({ ratio: 1 });
  await expect(named).toContainText('Tatooine');
  await expect(named.locator('[data-plan="distance"]')).toHaveText(/^\d+ m$/);
  await expect(lock).toHaveAttribute('data-edge', isMobile ? 'true' : 'false');
  await expect(page.locator('.game__label[data-course]')).toHaveCSS(
    'opacity',
    '0',
  );
  await expectClearOfInstruments(strip, 'strip');
  await expectClearOfInstruments(named, 'lock');
  // Clearing it from the strip takes it all away, and the radar's route.
  await strip.getByRole('button', { name: 'Clear the course' }).click();
  await expect(strip).toHaveCount(0);
  await expect(lock).toHaveCount(0);
  await expect(page.locator('.radar__route')).toHaveCount(0);
  await expect(page.locator('.game__label[data-course]')).toHaveCount(0);
  await expect(status).toHaveText('');
  expect(errors).toEqual([]);
});

test('aponta o destino da borda da tela quando a nave dá as costas a ele', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The keys turn the ship; phones share the same code.');
  await takeOff(page);
  await setCourse(page, 'Tatooine');
  const lock = page.locator('.course-lock');
  await expect(lock).toHaveAttribute('data-edge', 'false');
  // A half turn: the pad falls behind the camera.
  await steer(page, 'KeyD', -3);
  await expect(lock).toHaveAttribute('data-edge', 'true');
  await expect(lock.locator('.course-lock__arrow')).toHaveCSS('opacity', '1');
  await expect(lock.locator('.course-lock__text')).toBeInViewport({ ratio: 1 });
  await expectClearOfInstruments(lock.locator('.course-lock__text'), 'lock');
});

test('conta os portais em voo e encerra o plano ao pousar', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Phones fly with the joystick.');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await takeOff(page);
  // With the sound on, for the notes of the plan and of each gate.
  await page.getByRole('button', { name: 'Sound off' }).click();
  await setCourse(page, 'Tatooine');
  const strip = page.locator('.course-strip');
  await expect
    .poll(() => reading(page, 'route-gates'))
    .toBeGreaterThanOrEqual(2);
  // The same thrust that takes the ship to the first pad. Gates go by on the
  // way; the pad catches the ship, and the plan ends with the landing.
  await thrustPast(page, padApproach);
  const about = page.getByRole('dialog', { name: 'About Me' });
  await expect(about).toBeVisible({ timeout: 30_000 });
  expect(await reading(page, 'route-flown')).toBeGreaterThanOrEqual(2);
  await expect(strip).toHaveCount(0);
  await expect(page.locator('.course-lock')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('recalcula a rota quando a nave se desvia dela', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Phones fly with the joystick.');
  await takeOff(page);
  await setCourse(page, 'Tatooine');
  await expect
    .poll(() => reading(page, 'route-gates'))
    .toBeGreaterThanOrEqual(2);
  expect(await reading(page, 'route-recalculations')).toBe(0);
  // A quarter turn and off to the side, far from the route.
  await steer(page, 'KeyA', 1.4);
  await hold(page, 'KeyW', 1500);
  await expect
    .poll(() => reading(page, 'route-recalculations'), { timeout: 20_000 })
    .toBeGreaterThanOrEqual(1);
  // The plan goes on, from where the ship is now.
  await expect(page.locator('.course-strip')).toBeVisible();
  await expect(page.locator('.course-strip [data-plan="distance"]')).toHaveText(
    /^\d+ m$/,
  );
});

test('traça o plano de novo numa nova decolagem, a partir de onde a nave está', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Once is enough.');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await takeOff(page);
  await setCourse(page, 'Tatooine');
  const left = () =>
    page
      .locator('.course-strip [data-plan="distance"]')
      .textContent()
      .then((text) => Number.parseInt(text ?? '', 10));
  await expect.poll(left).toBeGreaterThan(60);
  const whole = await left();
  await hold(page, 'KeyW', 600);
  await expect.poll(left).toBeLessThan(whole);
  await page.getByRole('button', { name: 'Change ship' }).click();
  await page.getByRole('button', { name: 'Take off' }).click();
  await expect
    .poll(() => reading(page, 'time'), { timeout: 20_000 })
    .toBeGreaterThan(0.5);
  await expect(page.locator('.course-strip')).toBeVisible();
  await expect(page.locator('.course-lock__text')).toBeVisible();
  // From the start again, the whole way, with none of its gates flown.
  await expect.poll(left).toBeGreaterThanOrEqual(whole - 1);
  expect(await reading(page, 'route-flown')).toBe(0);
  expect(errors).toEqual([]);
});

test('leva a rota na cor do planeta de destino', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Once is enough.');
  await takeOff(page);
  // Two planets, each with its own color, on the strip, the lock, the radar
  // and the chart.
  for (const [place, id] of [
    ['Coruscant', 'experience'],
    ['Kamino', 'courses'],
  ] as const) {
    await setCourse(page, place);
    const accent = biomes[id].accent;
    const channels = [1, 3, 5].map((at) =>
      Number.parseInt(accent.slice(at, at + 2), 16),
    );
    const rgb = `rgb(${channels.join(', ')})`;
    await expect(page.locator('.course-strip')).toHaveCSS(
      'border-top-color',
      rgb,
    );
    await expect(page.locator('.course-lock')).toHaveCSS('color', rgb);
    await expect(page.locator('.radar__route polyline')).toHaveCSS(
      'stroke',
      rgb,
    );
    await page
      .getByRole('button', { name: 'Open the navigation chart' })
      .click();
    const map = page.getByRole('dialog', { name: 'Navigation chart' });
    await expect(map.locator('.chart__course')).toHaveCSS('stroke', rgb);
    // Picking the destination again clears the course, for the next one.
    await map
      .getByRole('button', { name: new RegExp(`^Set a course for ${place}`) })
      .click();
    await page.keyboard.press('Escape');
    await expect(map).toBeHidden();
  }
});

test.describe('modo foto', () => {
  const place = async (page: Page) =>
    (await page.locator('.photo').getAttribute('data-camera'))!
      .split(' ')
      .map(Number);
  const moved = (from: number[], to: number[]) =>
    Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);

  test('para o mundo e solta a câmera', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile',
      'With a keyboard and a mouse.',
    );
    await takeOff(page);
    await page.getByRole('button', { name: 'Photo mode' }).click();
    const photo = page.locator('.photo');
    await expect(photo).toHaveAttribute('data-camera', /\d/);
    // The world stands still: the flight's clock stops.
    const time = await reading(page, 'time');
    const x = await reading(page, 'x');
    const z = await reading(page, 'z');
    await page.waitForTimeout(400);
    expect(await reading(page, 'time')).toBe(time);

    // The keys move the camera, and not the ship.
    let from = await place(page);
    await page.keyboard.down('KeyW');
    await expect
      .poll(async () => moved(from, await place(page)))
      .toBeGreaterThan(1);
    await page.keyboard.up('KeyW');
    expect(await reading(page, 'x')).toBe(x);
    expect(await reading(page, 'z')).toBe(z);
    // E takes it up.
    from = await place(page);
    await page.keyboard.down('KeyE');
    await expect
      .poll(async () => (await place(page))[1] - from[1])
      .toBeGreaterThan(0.5);
    await page.keyboard.up('KeyE');

    // A drag on the picture goes around the ship.
    from = await place(page);
    const box = (await page.locator('.photo__surface').boundingBox())!;
    await page.mouse.move(box.width * 0.4, box.height * 0.6);
    await page.mouse.down();
    await page.mouse.move(box.width * 0.55, box.height * 0.6, { steps: 5 });
    await page.mouse.up();
    await expect
      .poll(async () => moved(from, await place(page)))
      .toBeGreaterThan(1);
    // The wheel brings it closer, and the slider says so.
    const distance = page.locator('.photo-range', { hasText: 'Distance' });
    const far = await distance.locator('output').textContent();
    await page.mouse.wheel(0, -600);
    await expect(distance.locator('output')).not.toHaveText(far!);
    // The sliders do it too, without a drag on the picture.
    await page.getByLabel('Zoom').fill('3');
    await expect
      .poll(async () => Number(await photo.getAttribute('data-fov')))
      .toBeLessThan(25);
    await page.getByLabel('Tilt').fill('20');
    await expect(
      page.locator('.photo-range', { hasText: 'Tilt' }).locator('output'),
    ).toHaveText('20°');
    // And R brings it back.
    await page.keyboard.press('KeyR');
    await expect
      .poll(async () => Number(await photo.getAttribute('data-fov')))
      .toBeGreaterThan(50);

    // H clears the screen, and the picture is all that stays.
    await page.keyboard.press('KeyH');
    await expect(page.locator('.photo__panel')).toBeHidden();
    await expect(page.locator('.photo__shutter')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(page.locator('.photo__panel')).toBeVisible();

    // The flight goes on from where it was, and the view comes back to it.
    await page.keyboard.press('Escape');
    await expect(photo).toBeHidden();
    await expect.poll(() => reading(page, 'time')).toBeGreaterThan(time);
    expect(await reading(page, 'x')).toBeCloseTo(x, 0);
  });

  test('mostra a prévia antes de salvar', async ({ page }, testInfo) => {
    await takeOff(page);
    await page.getByRole('button', { name: 'Photo mode' }).click();
    // On a phone the settings start closed, leaving the picture.
    const look = page.getByRole('button', { name: 'Look', exact: true });
    if (testInfo.project.name === 'mobile') {
      await expect(page.getByLabel('Zoom')).toBeHidden();
      await look.click();
    } else {
      await look.click();
    }
    await page.getByRole('button', { name: 'Noir', exact: true }).click();
    // The filter shows on the picture as it will come out.
    await expect(page.locator('.game__canvas')).toHaveCSS(
      'filter',
      /grayscale\(1\)/,
    );
    await page.getByRole('button', { name: 'Frame', exact: true }).click();
    await page.getByRole('button', { name: 'Square', exact: true }).click();
    await page.getByRole('button', { name: 'Take photo' }).click();

    const dialog = page.getByRole('dialog', { name: 'Your photo' });
    await expect(dialog).toBeVisible();
    // Square, in black and white, and sharper than the screen.
    const picture = await dialog.getByRole('img').evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      const { data } = canvas
        .getContext('2d')!
        .getImageData(0, 0, canvas.width, canvas.height);
      let colored = 0;
      for (let i = 0; i < data.length; i += 4 * 97) {
        if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) {
          colored += 1;
        }
      }
      return { width: canvas.width, height: canvas.height, colored };
    });
    expect(picture.width).toBe(picture.height);
    expect(picture.colored).toBe(0);

    // Nothing is saved until it is asked for.
    await expect(dialog.getByRole('status')).toHaveText('');
    const download = page.waitForEvent('download');
    await dialog.getByRole('link', { name: 'Save photo' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^portfolio-.*\.png$/);
    const png = await readFile((await file.path())!);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(picture.width);
    expect(png.readUInt32BE(20)).toBe(picture.height);
    await expect(dialog.getByRole('status')).toHaveText('Photo saved');

    // Escape goes back to the camera, and only then leaves it.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('.photo')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Take photo' }),
    ).toBeFocused();
    if (testInfo.project.name === 'mobile') return;
    // Space takes another.
    await page.keyboard.press('Space');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(page.locator('.photo')).toBeHidden();
    await expect(page.locator('.game__canvas')).toHaveCSS('filter', 'none');
  });

  test('deixa aproximar com dois dedos no celular', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Fingers.');
    await takeOff(page);
    await page.getByRole('button', { name: 'Photo mode' }).click();
    await page.getByRole('button', { name: 'Camera', exact: true }).click();
    const output = page
      .locator('.photo-range', { hasText: 'Distance' })
      .locator('output');
    await expect(output).toHaveText(/\d/);
    const before = parseInt((await output.textContent())!, 10);
    await page.getByRole('button', { name: 'Camera', exact: true }).click();
    const session = await page.context().newCDPSession(page);
    const touch = (type: string, points: { x: number; y: number }[]) =>
      session.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: points,
      } as never);
    await touch('touchStart', [
      { x: 170, y: 200 },
      { x: 220, y: 200 },
    ]);
    await touch('touchMove', [
      { x: 120, y: 200 },
      { x: 270, y: 200 },
    ]);
    await touch('touchMove', [
      { x: 80, y: 200 },
      { x: 310, y: 200 },
    ]);
    await touch('touchEnd', []);
    await page.getByRole('button', { name: 'Camera', exact: true }).click();
    await expect
      .poll(async () => parseInt((await output.textContent())!, 10))
      .toBeLessThan(before);
  });
});

test.describe('rótulos dos botões', () => {
  test('ficam por cima de tudo, sem cobrir os vizinhos', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'A touch has no hover.');
    await takeOff(page);
    const tip = page.locator('.g-tip');
    await expect(tip).toBeHidden();
    const tools = page.locator('.hud__tool');
    const boxes = await tools.evaluateAll((all) =>
      all.map((tool) => {
        const { left, right, top, bottom } = tool.getBoundingClientRect();
        return { left, right, top, bottom };
      }),
    );
    for (const [index, name] of [
      [0, 'Holocron archive'],
      [1, 'Sound off'],
      [2, 'Photo mode'],
      [3, 'HUD: full'],
    ] as const) {
      await tools.nth(index).hover();
      await expect(tip).toBeVisible();
      await expect(tip).toContainText(name);
      // It clears the row of buttons, and is not behind any of them.
      const box = (await tip.boundingBox())!;
      for (const tool of boxes) {
        const clear =
          box.y >= tool.bottom ||
          box.y + box.height <= tool.top ||
          box.x >= tool.right ||
          box.x + box.width <= tool.left;
        expect(clear, name).toBe(true);
      }
    }
    await page.mouse.move(700, 500);
    await expect(tip).toBeHidden();
  });

  test('saem da carta, sem dar a ela uma rolagem', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'A touch has no hover.');
    await takeOff(page);
    await page
      .getByRole('button', { name: 'Open the navigation chart' })
      .click();
    const map = page.getByRole('dialog', { name: 'Navigation chart' });
    await expect(map).toBeVisible();
    const sheet = page.locator('.game-map__sheet');
    const scrolls = () =>
      sheet.evaluate((element) => element.scrollWidth > element.clientWidth);
    expect(await scrolls()).toBe(false);
    const tip = page.locator('.g-tip');
    await page.locator('.destination__read').first().hover();
    await expect(tip).toHaveText('Remote access');
    await expect(tip).toBeVisible();
    expect(await scrolls()).toBe(false);
    // Beyond the sheet's edge, and whole on the screen.
    const box = (await tip.boundingBox())!;
    const edge = (await sheet.boundingBox())!;
    expect(box.x + box.width).toBeGreaterThan(edge.x + edge.width);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    // With no room at the side, it stays on the screen on the other one.
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.mouse.move(10, 10);
    await page.locator('.destination__read').first().hover();
    await expect(tip).toBeVisible();
    const narrow = (await tip.boundingBox())!;
    expect(narrow.x + narrow.width).toBeLessThanOrEqual(1100);
    // It goes when the dialog does.
    await page.keyboard.press('Escape');
    await expect(map).toBeHidden();
    await expect(tip).toBeHidden();
  });

  test('aparecem pelo teclado', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'With a keyboard.');
    await takeOff(page);
    await page.locator('.hud__tool').first().focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('.g-tip')).toBeVisible();
    await expect(page.locator('.g-tip')).toContainText('Sound off');
    await page.keyboard.press('Escape');
    await expect(page.locator('.g-tip')).toBeHidden();
  });
});

test('deixa só o quadro no modo foto, e a mira no HUD imersivo', async ({
  page,
}) => {
  await takeOff(page);
  await setCourse(page, 'Tatooine');
  const strip = page.locator('.course-strip');
  const named = page.locator('.course-lock__text');
  await expect(strip).toBeVisible();
  await expect(named).toBeVisible();
  // Photo mode: nothing over the picture.
  await page.getByRole('button', { name: 'Photo mode' }).click();
  await expect(page.locator('.photo')).toBeVisible();
  await expect(strip).toBeHidden();
  await expect(named).toBeHidden();
  await page.getByRole('button', { name: /Leave photo mode/ }).click();
  await expect(strip).toBeVisible();
  await expect(named).toBeVisible();
  // Full, minimal, immersive: the last keeps the lock and hides the strip.
  const view = page.locator('.hud__view');
  await view.click();
  await expect(page.locator('.hud')).toHaveAttribute('data-hud', 'minimal');
  await expect(strip).toBeVisible();
  await expectClearOfInstruments(strip, 'minimal');
  await view.click();
  await expect(page.locator('.hud')).toHaveAttribute('data-hud', 'immersive');
  await expect(strip).toBeHidden();
  await expect(named).toBeVisible();
});

test('mantém o plano de voo inteiro na tela nos três idiomas', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The narrow screen is the hard one.');
  const lands = [
    { path: '/play', chart: 'Open the navigation chart', take: 'Take off' },
    { path: '/pt/play', chart: 'Abrir a carta de navegação', take: 'Decolar' },
    {
      path: '/es/play',
      chart: 'Abrir la carta de navegación',
      take: 'Despegar',
    },
  ];
  for (const land of lands) {
    await page.goto(land.path);
    await page.getByRole('button', { name: land.take }).click();
    await expect
      .poll(() => reading(page, 'time'), { timeout: 20_000 })
      .toBeGreaterThan(0.5);
    await page.getByRole('button', { name: land.chart }).click();
    // The planet with the longest name.
    await page.locator('.destination').nth(1).click();
    await expect(page.locator('.flight-plan__fly')).toBeInViewport();
    await page.locator('.flight-plan__fly').click();
    await expect(page.locator('.game-map')).toHaveCount(0);
    const strip = page.locator('.course-strip');
    await expect(strip).toBeInViewport({ ratio: 1 });
    await expectClearOfInstruments(strip, land.path);
    // Nothing spills out of the strip, nor is cut short.
    const spills = await strip.evaluate((element) => {
      const edge = element.getBoundingClientRect();
      return [...element.querySelectorAll('strong, dd, dt, button')].filter(
        (piece) => {
          const box = piece.getBoundingClientRect();
          return (
            box.width > 0 &&
            (box.left < edge.left - 0.5 ||
              box.right > edge.right + 0.5 ||
              piece.scrollWidth > piece.clientWidth + 1)
          );
        },
      ).length;
    });
    expect(spills, land.path).toBe(0);
  }
});

test('guarda a missão para a próxima visita e recomeça só depois de confirmar', async ({
  page,
  isMobile,
}) => {
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

test('troca o HUD entre completo, mínimo e imersivo e lembra a escolha', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await takeOff(page);
  const hud = page.locator('.hud');
  const view = page.getByRole('button', { name: /^Change the HUD/ });
  await expect(hud).toHaveAttribute('data-hud', 'full');
  await expect(view).toHaveAccessibleName('Change the HUD (now full)');
  await expect(page.locator('.hud__log')).toBeVisible();
  // Minimal keeps the essentials.
  await view.click();
  await expect(hud).toHaveAttribute('data-hud', 'minimal');
  await expect(page.locator('.compass')).toBeHidden();
  await expect(page.locator('.hud__log')).toBeVisible();
  await expect(page.locator('.radar-button')).toBeVisible();
  // Immersive leaves the world, the way out, the switch back and, on
  // touch, the controls.
  await view.click();
  await expect(hud).toHaveAttribute('data-hud', 'immersive');
  await expect(page.locator('.hud__log')).toBeHidden();
  await expect(page.locator('.radar-button')).toBeHidden();
  await expect(page.locator('.hud__craft')).toBeHidden();
  await expect(
    page.getByRole('link', { name: 'Back to the portfolio' }),
  ).toBeVisible();
  await expect(view).toBeVisible();
  if (isMobile) {
    await expect(page.getByRole('slider', { name: 'Joystick' })).toBeVisible();
  }
  // The next visit flies with the same HUD.
  await page.reload();
  await page.getByRole('button', { name: /Take off/ }).click();
  await expect(hud).toHaveAttribute('data-hud', 'immersive');
  if (isMobile) return;
  // V goes round the modes too.
  await page.keyboard.press('KeyV');
  await expect(hud).toHaveAttribute('data-hud', 'full');
});

test('mostra os controles a quem não sai do lugar', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await takeOff(page);
  await expect(page.locator('.toast[data-kind="hint"]')).toContainText(
    isMobile ? 'Drag the joystick to fly' : 'W A S D or the arrows to fly',
    { timeout: 30_000 },
  );
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
  // Photo mode leaves only the picture.
  await page.getByRole('button', { name: 'Photo mode' }).click();
  await expect(page.locator('.hud__top')).toBeHidden();
  await page.getByRole('button', { name: 'Leave photo mode' }).click();
  await expect(page.locator('.hud__top')).toBeVisible();
  if (isMobile) return;
  // P enters it, Escape leaves it.
  await page.keyboard.press('KeyP');
  await expect(page.locator('.hud__top')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('.hud__top')).toBeVisible();
});

test('cada nave tem a própria voz, sem nada de um escapamento', () => {
  const list = Object.values(voices);
  expect(list).toHaveLength(shipNames.length);
  expect(new Set(list.map((voice) => JSON.stringify(voice))).size).toBe(
    shipNames.length,
  );
  const mix = ([idle, full]: readonly [number, number], load: number) =>
    idle + (full - idle) * load;
  // The harmonics that count, of each wave.
  const series: Partial<Record<OscillatorType, number[]>> = {
    sine: [1],
    triangle: [1, 3],
    square: [1, 3],
    sawtooth: [1, 2, 3],
  };
  const check = (voice: Voice, load: number, boost: number) => {
    const partials = voice.tones.flatMap((tone) => {
      const pitch =
        (tone.at
          ? mix(tone.at, load)
          : mix(voice.pitch, load) * (tone.ratio ?? 1)) * boost;
      // A hard-edged wave down low is a train of pulses.
      if (tone.wave === 'sawtooth' || tone.wave === 'square') {
        expect(pitch).toBeGreaterThanOrEqual(200);
      }
      return (series[tone.wave] ?? []).map((harmonic) => pitch * harmonic);
    });
    // Two low partials beat, and between 15 and 90 Hz apart that beat is the rate
    // of an exhaust. Closer, it is a slow swell; further, they don't beat.
    const low = partials.filter((partial) => partial < 500);
    for (const a of low) {
      for (const b of low) {
        const gap = Math.abs(a - b);
        expect(gap <= 15 || gap >= 90).toBe(true);
      }
    }
  };
  for (const voice of list) {
    // A motorcycle more than doubles its pitch.
    expect(voice.pitch[1] / voice.pitch[0]).toBeLessThan(1.6);
    for (const load of [0, 0.25, 0.5, 0.75, 1]) {
      check(voice, load, 1);
      check(voice, load, voice.boost);
    }
  }
});

test('toca o motor de cada nave no hangar, um de cada vez', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const audio = await watchAudio(page);
  await page.goto('/play');
  // With the sound off, choosing a ship plays nothing.
  await page.getByRole('radio', { name: 'TIE fighter' }).click();
  expect(await audio.running()).toBe(0);
  await page.getByRole('radio', { name: 'X-wing' }).click();
  // Turning it on plays the ship on the pedestal, for a moment, and all that is
  // left then is the wind's source, silent.
  await page.getByRole('button', { name: 'Sound off' }).click();
  await expect(page.getByRole('button', { name: 'Sound on' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect.poll(audio.loudest).toBeGreaterThan(0.004);
  await expect.poll(audio.level).toBeLessThan(0.0003);
  await expect.poll(audio.running).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('sound'))).toBe('on');
  await audio.tones();
  // Each ship plays its own voice, without waiting for the last one to end.
  const ids = Object.keys(voices) as (keyof typeof voices)[];
  for (const [index, name] of [...shipNames.entries()].slice(1)) {
    const voice = voices[ids[index]];
    await audio.reset();
    await page.getByRole('radio', { name }).click();
    await expect.poll(audio.loudest).toBeGreaterThan(0.004);
    expect(await audio.tones()).toEqual(
      voice.tones.map((tone) => {
        const pitch = tone.at ? tone.at[0] : voice.pitch[0] * (tone.ratio ?? 1);
        return `${tone.wave}:${Math.round(pitch * 0.62)}`;
      }),
    );
  }
  await expect.poll(audio.level).toBeLessThan(0.0003);
  await expect.poll(audio.running).toBe(1);
  // What comes out follows: the freighter is the deepest, and the A-wing the
  // brightest, measured where each is loudest, with nothing else playing.
  const brightness = async (name: string) => {
    await audio.reset();
    await page.getByRole('radio', { name }).click();
    await expect.poll(audio.loudest).toBeGreaterThan(0.004);
    await page.waitForTimeout(1200);
    const heard = await audio.brightness();
    await expect.poll(audio.level).toBeLessThan(0.0003);
    return heard;
  };
  expect(await brightness('Millennium Falcon')).toBeLessThan(450);
  expect(await brightness('A-wing')).toBeGreaterThan(700);
  // Choosing the same ship plays it again, and turning the sound off stops it.
  await audio.reset();
  await page.getByRole('radio', { name: shipNames[5] }).click();
  await expect.poll(audio.loudest).toBeGreaterThan(0.004);
  await page.getByRole('button', { name: 'Sound on' }).click();
  await expect.poll(audio.level).toBeLessThan(0.0003);
  await expect.poll(audio.running).toBe(1);
  await page.getByRole('radio', { name: 'X-wing' }).click();
  expect(await audio.running()).toBe(1);
  expect(errors).toEqual([]);
});

test('cala os motores no hangar e quando a página some', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Once is enough.');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  // The sound is on from the start, and what comes out of it is measured.
  await page.addInitScript(() => localStorage.setItem('sound', 'on'));
  const audio = await watchAudio(page);
  await takeOff(page);
  // In flight, the engines hum, softly while the ship idles.
  await expect.poll(audio.level).toBeGreaterThan(0.002);
  await expect.poll(audio.level).toBeLessThan(0.016);
  // Under the chart, they stay down for the reading, measured once the level
  // holds, within a fifth, for half a second.
  let flying = 0;
  await expect
    .poll(async () => {
      const before = await audio.level();
      await page.waitForTimeout(500);
      flying = await audio.level();
      return Math.abs(flying - before) / before;
    })
    .toBeLessThan(0.2);
  await page.keyboard.press('KeyM');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect.poll(audio.level).toBeLessThan(flying * 0.6);
  await page.keyboard.press('KeyM');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect.poll(audio.level).toBeGreaterThan(flying * 0.7);
  // The photo mode silences them, and they come back with the flight.
  await page.keyboard.press('KeyP');
  await expect(page.locator('.hud__top')).toBeHidden();
  await expect.poll(audio.level).toBeLessThan(0.0003);
  await page.keyboard.press('Escape');
  await expect(page.locator('.hud__top')).toBeVisible();
  await expect.poll(audio.level).toBeGreaterThan(0.002);
  // Back in the hangar, they stop, the wind dies down, and only its source runs.
  await page.getByRole('button', { name: 'Change ship' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Choose your ship',
  );
  await expect.poll(audio.level).toBeLessThan(0.0003);
  await expect.poll(audio.running).toBe(1);
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
  await expect.poll(audio.state).toBe('suspended');
  await hide(false);
  await expect.poll(audio.state).toBe('running');
  // On a new take-off they spool up and settle, the thrust opens them up, and the
  // boost brings a rush of air. This comes last, because the ship goes on to the
  // first platform, and its section opens over the buttons.
  await page.getByRole('button', { name: 'Take off' }).click();
  await expect
    .poll(() => reading(page, 'time'), { timeout: 20_000 })
    .toBeGreaterThan(0.5);
  await expect.poll(audio.level).toBeLessThan(0.016);
  await audio.reset();
  await page.keyboard.down('KeyW');
  await expect.poll(audio.loudest).toBeGreaterThan(0.016);
  const rushes = await audio.rushes();
  await page.keyboard.down('ShiftLeft');
  await expect.poll(audio.rushes).toBeGreaterThan(rushes);
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('KeyW');
  expect(errors).toEqual([]);
});

test('mostra de novo o nome do planeta quando a nave sai e volta', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Phones fly with the joystick.');
  await takeOff(page);
  await page.evaluate(() => {
    const titles: string[] = [];
    Object.assign(window, { titles });
    new MutationObserver((changes) => {
      for (const change of changes) {
        for (const node of change.addedNodes) {
          const name = (node as HTMLElement).querySelector(
            '.planet-title__name',
          );
          titles.push(name?.textContent ?? '');
        }
      }
    }).observe(document.querySelector('.planet-titles')!, { childList: true });
  });
  const titles = () =>
    page.evaluate(() => (window as unknown as { titles: string[] }).titles);
  // Flies to a point, turning and thrusting by the HUD's readings, every
  // frame, in the page: a command from the test can arrive late.
  const flyTo = (x: number, z: number) =>
    page.evaluate(
      ([x, z]) =>
        new Promise<void>((done, fail) => {
          const hud = document.querySelector<HTMLElement>('.hud')!;
          const send = (type: string, code: string) =>
            document.body.dispatchEvent(
              new KeyboardEvent(type, { code, bubbles: true }),
            );
          const held = new Set<string>();
          const want = (code: string, on: boolean) => {
            if (on === held.has(code)) return;
            if (on) held.add(code);
            else held.delete(code);
            send(on ? 'keydown' : 'keyup', code);
          };
          const started = performance.now();
          const check = () => {
            const dx = x - Number(hud.dataset.x);
            const dz = z - Number(hud.dataset.z);
            const heading = Number(hud.dataset.heading);
            const wanted = Math.atan2(-dx, -dz);
            const turn = Math.atan2(
              Math.sin(wanted - heading),
              Math.cos(wanted - heading),
            );
            const arrived = Math.hypot(dx, dz) < 6;
            const late = performance.now() - started > 40_000;
            want('KeyA', !arrived && !late && turn > 0.08);
            want('KeyD', !arrived && !late && turn < -0.08);
            want('KeyW', !arrived && !late && Math.abs(turn) < 0.6);
            if (arrived) done();
            else if (late) fail(new Error(`Still ${dx}, ${dz} away.`));
            else requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        }),
      [x, z] as const,
    );
  // Into Tatooine, the first planet ahead, short of its pad.
  await flyTo(0, -26);
  await expect.poll(titles).toEqual(['Tatooine']);
  // Back over the hub, for long enough to have left the planet, and in again.
  // The ship may coast on across the hub, into the planet beyond, which names
  // itself too.
  await flyTo(0, 0);
  await expect
    .poll(() => reading(page, 'speed'), { timeout: 20_000 })
    .toBeLessThan(1);
  await page.waitForTimeout(2500);
  await flyTo(0, -26);
  await expect
    .poll(() =>
      titles().then((names) => names.filter((n) => n === 'Tatooine').length),
    )
    .toBe(2);
  expect((await titles()).at(-1)).toBe('Tatooine');
});

test('voa pelo teclado, dá turbo e pousa na primeira plataforma', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Phones fly with the joystick.');
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

  // Thrust: the ship picks up speed and moves ahead, towards -Z. Straight
  // ahead lies the first pad, About Me; the thrust goes off well before it, as
  // a pilot would, the ship coasts in, the pad catches it, and once it stops
  // there the section opens over the flight.
  await thrustPast(page, padApproach);
  // Read by position, not speed: on a slow machine the pad may have caught
  // the ship before the first reading.
  await expect.poll(() => reading(page, 'z')).toBeLessThan(-5);
  await expect(page.locator('.hud__pad')).toContainText('About Me', {
    timeout: 20_000,
  });
  await expect(page.locator('.hud__pad')).toContainText('Landing zone');
  const about = page.getByRole('dialog', { name: 'About Me' });
  await expect(about).toBeVisible({ timeout: 10_000 });
  await expect(about).toContainText('with a focus on the backend');
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
  // The title of each planet the ship entered, as it entered, the first one
  // Tatooine; flying straight on, it never entered the same one twice.
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
    // The flight plan's strip finds its place among them.
    await setCourse(page, 'Coruscant');
    const strip = page.locator('.course-strip');
    await expect(strip).toBeInViewport({ ratio: 1 });
    await expectClearOfInstruments(strip, 'strip');
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
    // A course leaves the way back to the flight in sight, and a strip clear
    // of the rest of the HUD.
    await page
      .getByRole('button', { name: /^Set a course for Coruscant/ })
      .click();
    await expect(page.locator('.flight-plan__fly')).toBeInViewport({
      ratio: 1,
    });
    await page.locator('.flight-plan__fly').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const strip = page.locator('.course-strip');
    await expect(strip).toBeInViewport({ ratio: 1 });
    await expectClearOfInstruments(strip, 'strip');
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
  // Pushes the stick forward until the ship is on its way, then lets go well
  // before the first pad: the ship coasts in and lands there. By its position,
  // not by the clock: when the frames stalled, two and a half seconds of stick
  // left the ship stopped short of the pad.
  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX, centerY - 40, { steps: 5 });
  await expect
    .poll(() => reading(page, 'z'), { timeout: 30_000, intervals: [100] })
    .toBeLessThan(padApproach);
  await page.mouse.up();
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

test('esconde os rótulos das plataformas sob os instrumentos', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "On a phone the HUD's corners cover more of the view.");
  await takeOff(page);
  await expect(page.locator('.hud')).not.toHaveAttribute('data-arriving', {
    timeout: 30_000,
  });
  // The HUD's plates are see-through, so a waypoint under one hides instead
  // of tangling with its readings: at the start, Tatooine's lies behind the
  // mission log on a phone.
  const tangled = () =>
    page.evaluate(() => {
      const pieces = [
        ...document.querySelectorAll('.hud__nw > *, .hud__ne > *'),
      ]
        .map((piece) => piece.getBoundingClientRect())
        .filter((rect) => rect.width > 0 && rect.height > 0);
      return [...document.querySelectorAll<HTMLElement>('.game__label')]
        .filter((label) => {
          const style = getComputedStyle(label);
          if (style.display === 'none' || Number(style.opacity) === 0)
            return false;
          const rect = label.getBoundingClientRect();
          return pieces.some(
            (piece) =>
              rect.left < piece.right &&
              rect.right > piece.left &&
              rect.top < piece.bottom &&
              rect.bottom > piece.top,
          );
        })
        .map((label) => label.textContent);
    });
  await expect.poll(tangled).toEqual([]);
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
  await expect(page).toHaveTitle(
    'Jogar | Bruno Garcia — Engenheiro de Software Full-Stack',
  );
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
  await thrustPast(page, padApproach);
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
