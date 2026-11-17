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

  it('does not click a visible Skip button when no ad is showing', () => {
    // GIVEN a visible Skip button, but no ad is showing
    const { player, clicks, showSkipButton } = loadPlayer();
    showSkipButton();
    // WHEN the player is checked
    createSkipper().check(player);
    // THEN nothing is clicked
    expect(clicks).not.toHaveBeenCalled();
  });

  it('clicks only once while the same Skip button stays visible', () => {
    // GIVEN an ad is showing and its Skip button is visible
    const { player, clicks, startAd, showSkipButton } = loadPlayer();
    startAd();
    showSkipButton();
    const skipper = createSkipper();
    // WHEN the player is checked several times before the button goes away
    skipper.check(player);
    skipper.check(player);
    skipper.check(player);
    // THEN the Skip button is clicked once
    expect(clicks).toHaveBeenCalledOnce();
  });
});
