import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSkipper } from '../../src/core/skipper.js';
import { DEFAULT_SETTINGS } from '../../src/shared/constants.js';
import { loadPlayer } from '../fixtures/player.js';

/** Auto-skip on with no delay, as on a fresh install. */
const ON = { getSettings: () => DEFAULT_SETTINGS };

describe('skipper', () => {
  it('clicks the Skip button once it becomes visible after the countdown', () => {
    // GIVEN an ad is showing and its Skip button is still counting down
    const { player, clicks, startAd, showSkipButton } = loadPlayer();
    startAd();
    const skipper = createSkipper(ON);
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
    createSkipper(ON).check(player);
    // THEN nothing is clicked
    expect(clicks).not.toHaveBeenCalled();
  });

  it('clicks only once while the same Skip button stays visible', () => {
    // GIVEN an ad is showing and its Skip button is visible
    const { player, clicks, startAd, showSkipButton } = loadPlayer();
    startAd();
    showSkipButton();
    const skipper = createSkipper(ON);
    // WHEN the player is checked several times before the button goes away
    skipper.check(player);
    skipper.check(player);
    skipper.check(player);
    // THEN the Skip button is clicked once
    expect(clicks).toHaveBeenCalledOnce();
  });

  it('clicks again for the next ad in a pod after its countdown', () => {
    // GIVEN the first ad of a pod was skipped; the ad stays marked as showing
    const { player, clicks, startAd, showSkipButton, hideSkipButton } =
      loadPlayer();
    startAd();
    showSkipButton();
    const skipper = createSkipper(ON);
    skipper.check(player);
    // WHEN the second ad counts down, then shows its Skip button
    hideSkipButton();
    skipper.check(player);
    showSkipButton();
    skipper.check(player);
    // THEN each ad got one click
    expect(clicks).toHaveBeenCalledTimes(2);
  });

  it('does nothing during an ad without a Skip button', () => {
    // GIVEN an unskippable ad: the ad is showing and there is no Skip button
    const { player, button, clicks, startAd } = loadPlayer();
    startAd();
    button.remove();
    // WHEN the player is checked
    const check = () => createSkipper(ON).check(player);
    // THEN nothing is clicked and nothing is thrown
    expect(check).not.toThrow();
    expect(clicks).not.toHaveBeenCalled();
  });

  it('does not click a visible Skip button while auto-skip is off', () => {
    // GIVEN auto-skip is off, and an ad shows its Skip button
    const { player, clicks, startAd, showSkipButton } = loadPlayer();
    startAd();
    showSkipButton();
    const off = { ...DEFAULT_SETTINGS, enabled: false };
    // WHEN the player is checked
    createSkipper({ getSettings: () => off }).check(player);
    // THEN nothing is clicked
    expect(clicks).not.toHaveBeenCalled();
  });

  describe('with a delay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /**
     * Skipper options with auto-skip on and a delay.
     *
     * @param {number} delaySec Seconds to wait before clicking.
     */
    const delayOf = (delaySec) => ({
      getSettings: () => ({ enabled: true, delaySec }),
    });

    it.each([{ delaySec: 3 }, { delaySec: 10 }])(
      'clicks a visible Skip button $delaySec seconds after it appears',
      ({ delaySec }) => {
        // GIVEN an ad shows its Skip button
        const { player, clicks, startAd, showSkipButton } = loadPlayer();
        startAd();
        showSkipButton();
        // WHEN a skipper with a delay checks the player
        createSkipper(delayOf(delaySec)).check(player);
        // THEN it clicks once the delay has passed, not before
        vi.advanceTimersByTime(delaySec * 1000 - 1);
        expect(clicks).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(clicks).toHaveBeenCalledOnce();
      },
    );
  });
});
