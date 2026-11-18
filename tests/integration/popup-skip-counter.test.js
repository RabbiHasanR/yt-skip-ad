import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { followPlayer } from '../../src/content/follow-player.js';
import { CHECK_THROTTLE_MS } from '../../src/shared/constants.js';
import { watchSettings } from '../../src/shared/storage.js';
import { loadPlayer } from '../fixtures/player.js';
import { seedStorage } from '../setup/storage.js';

const POPUP = '../../popup/popup.js';

/**
 * Opens the popup as Chrome does: its HTML, then its module script.
 *
 * @returns {Promise<{ count: HTMLOutputElement | null }>} The skip counter.
 */
async function openPopup() {
  document.documentElement.innerHTML = readFileSync('popup/popup.html', 'utf8');
  await import(POPUP);
  return { count: document.querySelector('output') };
}

describe('popup skip counter', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows the skip counter increased by 1 after the content script clicks Skip', async () => {
    // GIVEN 4 ads were already skipped on this computer
    await seedStorage({ skipCount: 4 }, 'local');
    // WHEN the content script skips one more ad
    vi.useFakeTimers();
    const { startAd, showSkipButton, clicks } = loadPlayer();
    const stop = followPlayer(document, await watchSettings());
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    stop();
    vi.useRealTimers();
    expect(clicks).toHaveBeenCalledOnce();
    // THEN the popup shows 5 ads skipped
    const { count } = await openPopup();
    await vi.waitFor(() => expect(count?.value).toBe('5'));
  });

  it('shows 0 ads skipped on a fresh install', async () => {
    // GIVEN a fresh install: nothing is stored yet
    // WHEN a colleague opens the popup
    const { count } = await openPopup();
    // THEN it shows 0 ads skipped
    await vi.waitFor(() => expect(count?.value).toBe('0'));
  });
});
