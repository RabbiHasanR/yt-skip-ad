import { LOG_PREFIX } from '../../src/shared/constants.js';
import { expect, test, YOUTUBE_FIXTURE_URL } from './fixtures.js';

test('the loaded extension clicks the Skip button on a YouTube-like page', async ({
  page,
}) => {
  // GIVEN a YouTube watch page with the extension's content script running
  const loaded = page.waitForEvent('console', {
    predicate: (message) =>
      message.text() === `${LOG_PREFIX} content script loaded`,
  });
  await page.goto(YOUTUBE_FIXTURE_URL);
  await loaded;
  const skipButton = page.locator('.ytp-skip-ad-button');
  await skipButton.evaluate((button) => {
    // Counted from the page's own world, like YouTube's click handler.
    button.addEventListener('click', () => {
      button.dataset.clicks = String(Number(button.dataset.clicks ?? 0) + 1);
    });
  });
  // WHEN an ad starts, then its Skip button appears after the countdown
  await page
    .locator('#movie_player')
    .evaluate((player) => player.classList.add('ad-showing'));
  await page.locator('.ytp-skip-ad').evaluate((slot) => {
    /** @type {HTMLElement} */ (slot).style.display = '';
  });
  // THEN the extension clicks it once
  await expect(skipButton).toHaveAttribute('data-clicks', '1');
  await page.waitForTimeout(500);
  await expect(skipButton).toHaveAttribute('data-clicks', '1');
});
