import {
  countTrustedSkipClicks,
  expect,
  openYouTubeFixture,
  showSkippableAd,
  test,
} from './fixtures.js';

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
  await openYouTubeFixture(page);
  const skipButton = await countTrustedSkipClicks(page);
  await showSkippableAd(page);
  // THEN the extension leaves the Skip button alone
  await page.waitForTimeout(500);
  await expect(skipButton).toHaveAttribute('data-clicks', '0');
});
