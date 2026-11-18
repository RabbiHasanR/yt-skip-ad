// Playwright fixtures: a Chromium context with the unpacked extension loaded,
// offline. The one YouTube-like URL below is served from tests/fixtures/, so
// the manifest's YouTube match injects the real content script; every other
// web request is aborted, so nothing leaves the machine. Only http(s) is
// routed: Playwright would otherwise intercept the loader's import() of
// chrome-extension:// files too.
import { test as base, chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOG_PREFIX } from '../../src/shared/constants.js';
import { extensionIdFromKey } from '../fixtures/extension-id.js';

/** The repo folder: the unpacked extension the tests load by default. */
export const REPO_DIR = fileURLToPath(new URL('../../', import.meta.url));
const PLAYER_FIXTURE = fileURLToPath(
  new URL('../fixtures/player.html', import.meta.url),
);

/** URL that serves `tests/fixtures/player.html` inside the test browser. */
export const YOUTUBE_FIXTURE_URL = 'https://www.youtube.com/watch?v=fixture';

/**
 * Tells whether a request goes to the web, as opposed to extension files.
 *
 * @param {URL} url The request URL.
 * @returns {boolean} True for http: and https: URLs.
 */
function isWebRequest(url) {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

/**
 * Opens the YouTube-like fixture page and waits for the content script.
 *
 * @param {import('@playwright/test').Page} page The tab to use.
 * @returns {Promise<void>} Resolves once the content script has loaded.
 */
export async function openYouTubeFixture(page) {
  const loaded = page.waitForEvent('console', {
    predicate: (message) =>
      message.text() === `${LOG_PREFIX} content script loaded`,
  });
  await page.goto(YOUTUBE_FIXTURE_URL);
  await loaded;
}

/**
 * Counts trusted clicks on the fixture's Skip button in its `data-clicks`
 * attribute, from the page's own world, as YouTube's click handler does: it
 * ignores clicks whose `isTrusted` is false.
 *
 * @param {import('@playwright/test').Page} page The fixture page.
 * @returns {Promise<import('@playwright/test').Locator>} The Skip button.
 */
export async function countTrustedSkipClicks(page) {
  const skipButton = page.locator('.ytp-skip-ad-button');
  await skipButton.evaluate((button) => {
    button.dataset.clicks = '0';
    button.addEventListener('click', (event) => {
      if (!event.isTrusted) return;
      button.dataset.clicks = String(Number(button.dataset.clicks) + 1);
    });
  });
  return skipButton;
}

/**
 * Starts an ad on the fixture page and shows its Skip button, as YouTube
 * does after the countdown.
 *
 * @param {import('@playwright/test').Page} page The fixture page.
 * @returns {Promise<void>} Resolves once the button is visible.
 */
export async function showSkippableAd(page) {
  await page
    .locator('#movie_player')
    .evaluate((player) => player.classList.add('ad-showing'));
  await page.locator('.ytp-skip-ad').evaluate((slot) => {
    /** @type {HTMLElement} */ (slot).style.display = '';
  });
}

/**
 * @type {import('@playwright/test').TestType<
 *   import('@playwright/test').PlaywrightTestArgs &
 *     import('@playwright/test').PlaywrightTestOptions & {
 *       extensionDir: string,
 *       extensionId: string,
 *     },
 *   import('@playwright/test').PlaywrightWorkerArgs &
 *     import('@playwright/test').PlaywrightWorkerOptions
 * >}
 */
export const test = base.extend({
  // The unpacked extension folder to load; a spec can override it.
  // Playwright reads fixture dependencies from the destructured first arg.
  // eslint-disable-next-line no-empty-pattern
  extensionDir: async ({}, use) => {
    await use(REPO_DIR);
  },
  context: async ({ extensionDir }, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${extensionDir}`,
        `--load-extension=${extensionDir}`,
      ],
    });
    await context.route(isWebRequest, (route) =>
      route.request().url() === YOUTUBE_FIXTURE_URL
        ? route.fulfill({ path: PLAYER_FIXTURE })
        : route.abort(),
    );
    await use(context);
    await context.close();
  },
  extensionId: async ({ extensionDir }, use) => {
    // With no service worker, Playwright can't read the ID; the manifest's
    // key fixes it instead, whatever folder Chromium loads.
    const manifestPath = join(extensionDir, 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    await use(extensionIdFromKey(manifest.key));
  },
});

export const expect = test.expect;
