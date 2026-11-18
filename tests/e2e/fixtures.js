// Playwright fixtures: a Chromium context with the unpacked extension loaded,
// offline. The one YouTube-like URL below is served from tests/fixtures/, so
// the manifest's YouTube match injects the real content script; every other
// web request is aborted, so nothing leaves the machine. Only http(s) is
// routed: Playwright would otherwise intercept the loader's import() of
// chrome-extension:// files too.
import { test as base, chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EXTENSION_DIR = fileURLToPath(new URL('../../', import.meta.url));
const PLAYER_FIXTURE = fileURLToPath(
  new URL('../fixtures/player.html', import.meta.url),
);

/** URL that serves `tests/fixtures/player.html` inside the test browser. */
export const YOUTUBE_FIXTURE_URL = 'https://www.youtube.com/watch?v=fixture';

/**
 * Works out an unpacked extension's ID the way Chrome does: SHA-256 of the
 * folder's absolute path (symlinks resolved, no trailing slash), first 32
 * hex digits, each mapped 0–f to a–p. The extension has no service worker,
 * so Playwright's usual way of reading the ID doesn't apply.
 *
 * @param {string} dir The unpacked extension folder.
 * @returns {string} The extension ID Chrome gives that folder.
 */
function unpackedExtensionId(dir) {
  const hex = createHash('sha256')
    .update(realpathSync(dir))
    .digest('hex')
    .slice(0, 32);
  return [...hex]
    .map((digit) => String.fromCharCode(97 + parseInt(digit, 16)))
    .join('');
}

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
 * @type {import('@playwright/test').TestType<
 *   import('@playwright/test').PlaywrightTestArgs &
 *     import('@playwright/test').PlaywrightTestOptions & { extensionId: string },
 *   import('@playwright/test').PlaywrightWorkerArgs &
 *     import('@playwright/test').PlaywrightWorkerOptions
 * >}
 */
export const test = base.extend({
  // Playwright reads fixture dependencies from the destructured first arg.
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${EXTENSION_DIR}`,
        `--load-extension=${EXTENSION_DIR}`,
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
  // eslint-disable-next-line no-empty-pattern
  extensionId: async ({}, use) => {
    await use(unpackedExtensionId(EXTENSION_DIR));
  },
});

export const expect = test.expect;
