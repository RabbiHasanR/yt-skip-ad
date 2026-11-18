import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { followPlayer } from '../../src/content/follow-player.js';
import { CHECK_THROTTLE_MS } from '../../src/shared/constants.js';
import { watchSettings } from '../../src/shared/storage.js';
import { loadPlayer } from '../fixtures/player.js';
import { seedStorage } from '../setup/storage.js';

/**
 * Reads the skip counter straight from the mock's local storage area.
 *
 * @returns {Promise<unknown>} The stored count, or undefined if none.
 */
const storedCount = async () =>
  (await chrome.storage.local.get({ skipCount: undefined })).skipCount;

describe('content script counts skips', () => {
  /** @type {() => void} */
  let stop = () => {};

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    stop();
    stop = () => {};
    vi.useRealTimers();
  });

  it('adds 1 to the skip counter when the content script clicks Skip', async () => {
    // GIVEN the content script follows a player, with nothing counted yet
    const { startAd, showSkipButton, clicks } = loadPlayer();
    stop = followPlayer(document, await watchSettings());
    // WHEN an ad shows its Skip button and the content script clicks it
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    expect(clicks).toHaveBeenCalledOnce();
    // THEN the skip counter is 1
    expect(await storedCount()).toBe(1);
  });

  it('keeps skipping when saving the skip counter fails, logging one error', async () => {
    // GIVEN this computer's storage refuses writes
    const failure = new Error('quota exceeded');
    vi.mocked(chrome.storage.local.set).mockRejectedValue(failure);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { startAd, showSkipButton, clicks } = loadPlayer();
    stop = followPlayer(document, await watchSettings());
    // WHEN an ad shows its Skip button
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN the ad is still skipped, and one error is logged, not thrown
    expect(clicks).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledExactlyOnceWith(
      '[yt-skip-ad] failed to save the skip counter',
      failure,
    );
  });

  it('does not count a wait called off when navigation replaces the player', async () => {
    // GIVEN a 3-second delay, and a wait running for the first player's ad
    await seedStorage({ delaySec: 3 });
    const first = loadPlayer();
    stop = followPlayer(document, await watchSettings());
    first.startAd();
    first.showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // WHEN in-page navigation replaces the player before the wait ends
    loadPlayer();
    document.dispatchEvent(new Event('yt-navigate-finish'));
    await vi.advanceTimersByTimeAsync(3000);
    // THEN nothing is counted
    expect(await storedCount()).toBeUndefined();
  });
});
