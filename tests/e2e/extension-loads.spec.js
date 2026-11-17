import { LOG_PREFIX } from '../../src/shared/constants.js';
import { expect, test, YOUTUBE_FIXTURE_URL } from './fixtures.js';

test('the unpacked extension runs its content script on a YouTube URL', async ({
  page,
}) => {
  // GIVEN Chromium with the unpacked extension loaded
  const loaded = page.waitForEvent('console', {
    predicate: (message) =>
      message.text() === `${LOG_PREFIX} content script loaded`,
  });
  // WHEN it opens a YouTube watch URL
  await page.goto(YOUTUBE_FIXTURE_URL);
  // THEN the real loader imports the content entry, which logs once
  expect((await loaded).type()).toBe('log');
});
