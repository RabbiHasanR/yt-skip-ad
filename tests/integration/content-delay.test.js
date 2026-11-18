import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { followPlayer } from '../../src/content/follow-player.js';
import { CHECK_THROTTLE_MS } from '../../src/shared/constants.js';
import { watchSettings } from '../../src/shared/storage.js';
import { loadPlayer } from '../fixtures/player.js';
import { seedStorage } from '../setup/storage.js';

describe('content script waits the delay', () => {
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

  it.fails(
    'clicks the Skip button delaySec seconds after it appears',
    async () => {
      // GIVEN a colleague set a 3-second delay, and the page has a player
      await seedStorage({ delaySec: 3 });
      const { startAd, showSkipButton, clicks } = loadPlayer();
      stop = followPlayer(document, await watchSettings());
      // WHEN an ad shows its Skip button
      startAd();
      showSkipButton();
      // THEN it is clicked 3 s after the check that sees it, not before
      await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS + 2999);
      expect(clicks).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(clicks).toHaveBeenCalledOnce();
    },
  );
});
