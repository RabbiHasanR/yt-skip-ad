import { LOG_PREFIX } from '../../src/shared/constants.js';
import { expect, test, YOUTUBE_FIXTURE_URL } from './fixtures.js';

test('turning auto-skip off in the popup stops the Skip click on a YouTube-like page', async ({
  context,
  extensionId,
  page,
}) => {
  // GIVEN a colleague unticks "Auto-skip ads" in the extension's popup
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  await popup.getByLabel('Auto-skip ads').uncheck();
  await expect
    .poll(() =>
      popup.evaluate(
        async () => (await chrome.storage.sync.get('enabled')).enabled,
      ),
    )
    .toBe(false);
  // WHEN a YouTube watch page shows an ad with a visible Skip button
  const loaded = page.waitForEvent('console', {
    predicate: (message) =>
      message.text() === `${LOG_PREFIX} content script loaded`,
  });
  await page.goto(YOUTUBE_FIXTURE_URL);
  await loaded;
  const skipButton = page.locator('.ytp-skip-ad-button');
  await skipButton.evaluate((button) => {
    // Counted from the page's own world, like YouTube's click handler.
    button.dataset.clicks = '0';
    button.addEventListener('click', (event) => {
      if (!event.isTrusted) return;
      button.dataset.clicks = String(Number(button.dataset.clicks) + 1);
    });
  });
  await page
    .locator('#movie_player')
    .evaluate((player) => player.classList.add('ad-showing'));
  await page.locator('.ytp-skip-ad').evaluate((slot) => {
    /** @type {HTMLElement} */ (slot).style.display = '';
  });
  // THEN the extension leaves the Skip button alone
  await page.waitForTimeout(500);
  await expect(skipButton).toHaveAttribute('data-clicks', '0');
});
