import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHECK_THROTTLE_MS } from '../../src/shared/constants.js';
import { loadPlayer } from '../fixtures/player.js';

const MAIN = '../../src/content/main.js';

describe('content script follows the settings', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
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
    await chrome.storage.sync.set({ enabled: false });
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN the next ad is not skipped
    expect(clicks).toHaveBeenCalledOnce();
  });
});
