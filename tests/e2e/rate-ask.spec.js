import {
  RATE_BADGE_TEXT,
  RATE_FIRST_ASK_AT,
} from '../../src/shared/constants.js';
import { expect, test } from './fixtures.js';

test('the real worker shows a ★ badge when a skip crosses 50 in a fullscreen window', async ({
  context,
  extensionId,
}) => {
  // GIVEN Chromium with the extension's service worker running, an extension
  // page in a fullscreen window, and 49 ads skipped
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker'));
  expect(worker.url()).toBe(
    `chrome-extension://${extensionId}/src/background/service-worker.js`,
  );
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  await page.evaluate(async (skipCount) => {
    const window = await chrome.windows.getCurrent();
    await chrome.windows.update(/** @type {number} */ (window.id), {
      state: 'fullscreen',
    });
    await chrome.storage.local.set({ skipCount });
  }, RATE_FIRST_ASK_AT - 1);
  // WHEN a skip takes the counter to 50
  await page.evaluate(
    (skipCount) => chrome.storage.local.set({ skipCount }),
    RATE_FIRST_ASK_AT,
  );
  // THEN the worker leaves the video alone and puts the ★ badge on the icon
  await expect
    .poll(() => page.evaluate(() => chrome.action.getBadgeText({})))
    .toBe(RATE_BADGE_TEXT);
});
