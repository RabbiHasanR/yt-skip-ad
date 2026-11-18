import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { followPlayer } from '../../src/content/follow-player.js';
import { CHECK_THROTTLE_MS } from '../../src/shared/constants.js';
import { watchSettings } from '../../src/shared/storage.js';
import { loadPlayer } from '../fixtures/player.js';

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
});
