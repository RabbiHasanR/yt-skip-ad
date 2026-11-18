import {
  countTrustedSkipClicks,
  expect,
  openYouTubeFixture,
  showSkippableAd,
  test,
} from './fixtures.js';

test('the loaded extension clicks the Skip button on a YouTube-like page', async ({
  page,
}) => {
  // GIVEN a YouTube watch page with the extension's content script running
  await openYouTubeFixture(page);
  const skipButton = await countTrustedSkipClicks(page);
  // WHEN an ad starts, then its Skip button appears after the countdown
  await showSkippableAd(page);
  // THEN the extension clicks it once, and YouTube counts the click
  await expect(skipButton).toHaveAttribute('data-clicks', '1');
  await page.waitForTimeout(500);
  await expect(skipButton).toHaveAttribute('data-clicks', '1');
});
