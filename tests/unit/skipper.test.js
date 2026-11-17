import { describe, expect, it } from 'vitest';
import { createSkipper } from '../../src/core/skipper.js';
import { loadPlayer } from '../fixtures/player.js';

describe('skipper', () => {
  it('clicks the Skip button once it becomes visible after the countdown', () => {
    // GIVEN an ad is showing and its Skip button is still counting down
    const { player, clicks, startAd, showSkipButton } = loadPlayer();
    startAd();
    const skipper = createSkipper();
    skipper.check(player);
    expect(clicks).not.toHaveBeenCalled();
    // WHEN the Skip button appears and the player is checked again
    showSkipButton();
    skipper.check(player);
    // THEN the Skip button is clicked
    expect(clicks).toHaveBeenCalledOnce();
  });
});
