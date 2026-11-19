import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { followPlayer } from '../../src/content/follow-player.js';
import { CHECK_THROTTLE_MS } from '../../src/shared/constants.js';
import { watchSettings } from '../../src/shared/storage.js';
import { loadPlayer } from '../fixtures/player.js';
import { seedStorage } from '../setup/storage.js';

const MAIN = '../../src/content/main.js';

describe('content script follows the settings', () => {
  /** @type {() => void} */
  let stop = () => {};

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    stop();
    stop = () => {};
    vi.useRealTimers();
  });

  it('stops clicking when auto-skip is turned off in storage, without a reload', async () => {
    // GIVEN the content script skipped an ad on the page
    const { startAd, endAd, showSkipButton, hideSkipButton, clicks } =
      loadPlayer();
    await import(MAIN);
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    expect(clicks).toHaveBeenCalledOnce();
    endAd();
    hideSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // WHEN a colleague turns auto-skip off, then the next ad shows Skip
    await chrome.storage.local.set({ enabled: false });
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN the next ad is not skipped
    expect(clicks).toHaveBeenCalledOnce();
  });

  it('skips the ad on screen when auto-skip is turned back on', async () => {
    // GIVEN auto-skip is off, and an ad shows its Skip button, unclicked
    await seedStorage({ enabled: false });
    const { startAd, showSkipButton, clicks } = loadPlayer();
    stop = followPlayer(document, await watchSettings());
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    expect(clicks).not.toHaveBeenCalled();
    // WHEN a colleague turns auto-skip back on, with no other page change
    await chrome.storage.local.set({ enabled: true });
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN the ad on screen is skipped
    expect(clicks).toHaveBeenCalledOnce();
  });

  it('does not click an ad already showing at load when auto-skip is stored off', async () => {
    // GIVEN a colleague turned auto-skip off earlier, and an ad shows Skip
    await seedStorage({ enabled: false });
    const { startAd, showSkipButton, clicks } = loadPlayer();
    startAd();
    showSkipButton();
    // WHEN the content script loads on the page
    await import(MAIN);
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN the ad is not skipped
    expect(clicks).not.toHaveBeenCalled();
  });

  it('handles a settings change on a page without a player without errors', async () => {
    // GIVEN the content script runs on a page without a player, like Shorts
    document.body.replaceChildren();
    stop = followPlayer(document, await watchSettings());
    // WHEN a colleague turns auto-skip off and on again
    const toggle = async () => {
      await chrome.storage.local.set({ enabled: false });
      await chrome.storage.local.set({ enabled: true });
      await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    };
    // THEN nothing is thrown
    await expect(toggle()).resolves.toBeUndefined();
  });
});
