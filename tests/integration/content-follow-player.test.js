import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { followPlayer } from '../../src/content/follow-player.js';
import { CHECK_THROTTLE_MS } from '../../src/shared/constants.js';
import { watchSettings } from '../../src/shared/storage.js';
import { loadPlayer } from '../fixtures/player.js';

describe('content script follows the player', () => {
  /** @type {() => void} */
  let stop = () => {};

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
  });

  it('skips an ad that starts after the page has loaded', async () => {
    // GIVEN the content script follows a player with no ad yet
    const { startAd, showSkipButton, clicks } = loadPlayer();
    stop = followPlayer(document, await watchSettings());
    // WHEN an ad starts and its Skip button appears
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN the Skip button is clicked within the throttle wait
    expect(clicks).toHaveBeenCalledOnce();
  });

  it('follows a player that appears after the content script loads', async () => {
    // GIVEN the content script starts on a page with no player yet
    document.body.replaceChildren();
    stop = followPlayer(document, await watchSettings());
    // WHEN the player appears, then an ad with a visible Skip button
    const { startAd, showSkipButton, clicks } = loadPlayer();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN its Skip button is clicked
    expect(clicks).toHaveBeenCalledOnce();
  });

  it('keeps skipping after navigation replaces the player', async () => {
    // GIVEN the content script follows a player
    loadPlayer();
    stop = followPlayer(document, await watchSettings());
    // WHEN in-page navigation replaces it, and the new player shows an ad
    const next = loadPlayer();
    document.dispatchEvent(new Event('yt-navigate-finish'));
    next.startAd();
    next.showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN the new player's Skip button is clicked
    expect(next.clicks).toHaveBeenCalledOnce();
  });

  it('does not click when the ad ends before the throttled check runs', async () => {
    // GIVEN the content script follows a player
    const { startAd, endAd, showSkipButton, clicks } = loadPlayer();
    stop = followPlayer(document, await watchSettings());
    // WHEN an ad shows its Skip button, but ends before the check runs
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS / 2);
    endAd();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN nothing is clicked, though the button is still visible
    expect(clicks).not.toHaveBeenCalled();
  });

  it('does not click again when navigation keeps the same player', async () => {
    // GIVEN an ad's Skip button was clicked and is still visible
    const { startAd, showSkipButton, clicks } = loadPlayer();
    startAd();
    showSkipButton();
    stop = followPlayer(document, await watchSettings());
    // WHEN in-page navigation finishes with the same player
    document.dispatchEvent(new Event('yt-navigate-finish'));
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN the button is not clicked again
    expect(clicks).toHaveBeenCalledOnce();
  });
});
