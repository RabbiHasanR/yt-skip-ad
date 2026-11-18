import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { packageExtension } from '../../scripts/package.js';
import { EXPECTED_EXTENSION_ID } from '../fixtures/extension-id.js';
import {
  countTrustedSkipClicks,
  expect,
  openYouTubeFixture,
  REPO_DIR,
  showSkippableAd,
  test as base,
} from './fixtures.js';

// Loads the extension the way a colleague installs it: from a folder
// unzipped out of a freshly built dist zip, not from the repo.
const test = base.extend({
  // Playwright reads fixture dependencies from the destructured first arg.
  // eslint-disable-next-line no-empty-pattern
  extensionDir: async ({}, use) => {
    const workDir = mkdtempSync(join(tmpdir(), 'yt-skip-ad-install-'));
    const zipPath = packageExtension({
      rootDir: REPO_DIR,
      outDir: join(workDir, 'dist'),
    });
    const installDir = join(workDir, 'YT Skip Ad');
    execFileSync('unzip', ['-q', zipPath, '-d', installDir]);
    await use(installDir);
    rmSync(workDir, { recursive: true, force: true });
  },
});

test('the extension unzipped from the dist zip loads with the pinned ID and skips an ad', async ({
  context,
  page,
}) => {
  // GIVEN a colleague's folder, unzipped from the dist zip, loaded in Chromium
  // WHEN they open the popup at the pinned ID, then watch a video with an ad
  const popup = await context.newPage();
  await popup.goto(
    `chrome-extension://${EXPECTED_EXTENSION_ID}/popup/popup.html`,
  );
  await expect(popup.getByLabel('Auto-skip ads')).toBeChecked();
  await openYouTubeFixture(page);
  const skipButton = await countTrustedSkipClicks(page);
  await showSkippableAd(page);
  // THEN the popup is there at that ID, and the ad is skipped once
  await expect(skipButton).toHaveAttribute('data-clicks', '1');
});
