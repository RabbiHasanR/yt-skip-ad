import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { followPlayer } from '../../src/content/follow-player.js';
import { CHECK_THROTTLE_MS } from '../../src/shared/constants.js';
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
    stop = followPlayer(document);
    // WHEN an ad starts and its Skip button appears
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    // THEN the Skip button is clicked within the throttle wait
    expect(clicks).toHaveBeenCalledOnce();
  });
});
