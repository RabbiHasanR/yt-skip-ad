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

    it.each([
      { what: 'the ad ends', change: 'endAd' },
      { what: 'the Skip button is hidden', change: 'hideSkipButton' },
    ])('does not click when $what during the delay', ({ change }) => {
      // GIVEN a skipper is waiting 3 s to click a visible Skip button
      const fixture = loadPlayer();
      fixture.startAd();
      fixture.showSkipButton();
      createSkipper(delayOf(3)).check(fixture.player);
      // WHEN the player changes during the wait
      fixture[/** @type {'endAd' | 'hideSkipButton'} */ (change)]();
      vi.advanceTimersByTime(3000);
      // THEN nothing is clicked
      expect(fixture.clicks).not.toHaveBeenCalled();
    });

    it('does not click when auto-skip is turned off during the delay, and waits again once it is back on', () => {
      // GIVEN a skipper is waiting 3 s to click a visible Skip button
      const { player, clicks, startAd, showSkipButton } = loadPlayer();
      startAd();
      showSkipButton();
      const settings = { enabled: true, delaySec: 3 };
      const skipper = createSkipper({ getSettings: () => settings });
      skipper.check(player);
      // WHEN auto-skip is turned off before the wait ends
      settings.enabled = false;
      vi.advanceTimersByTime(3000);
      // THEN nothing is clicked
      expect(clicks).not.toHaveBeenCalled();
      // WHEN it is turned back on and the player is checked
      settings.enabled = true;
      skipper.check(player);
      // THEN the Skip button gets a new full wait, then one click
      vi.advanceTimersByTime(2999);
      expect(clicks).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(clicks).toHaveBeenCalledOnce();
    });

    it('clicks each ad of a pod once, each after its own delay', () => {
      // GIVEN a 2-second delay, and the first ad of a pod shows Skip
      const { player, clicks, startAd, showSkipButton, hideSkipButton } =
        loadPlayer();
      startAd();
      showSkipButton();
      const skipper = createSkipper(delayOf(2));
      // WHEN the player is checked several times during the first wait
      skipper.check(player);
      skipper.check(player);
      vi.advanceTimersByTime(1000);
      skipper.check(player);
      vi.advanceTimersByTime(1000);
      // THEN the first ad gets one click
      expect(clicks).toHaveBeenCalledOnce();
      // WHEN the second ad counts down, then shows Skip
      hideSkipButton();
      skipper.check(player);
      showSkipButton();
      skipper.check(player);
      // THEN it gets its own full wait and one click
      vi.advanceTimersByTime(1999);
      expect(clicks).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(1);
      expect(clicks).toHaveBeenCalledTimes(2);
    });

    it('gives a Skip button that reappears during the delay its own full wait', () => {
      // GIVEN a skipper is waiting 3 s to click a visible Skip button
      const { player, clicks, startAd, showSkipButton, hideSkipButton } =
        loadPlayer();
      startAd();
      showSkipButton();
      const skipper = createSkipper(delayOf(3));
      skipper.check(player);
      // WHEN, 1 s in, the button is hidden and then shown again
      vi.advanceTimersByTime(1000);
      hideSkipButton();
      skipper.check(player);
      showSkipButton();
      skipper.check(player);
      // THEN the first wait clicks nothing; the new one clicks 3 s later
      vi.advanceTimersByTime(2999);
      expect(clicks).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(clicks).toHaveBeenCalledOnce();
    });

    it("keeps a running wait's length when the delay changes, and uses the new one next", () => {
      // GIVEN a skipper is waiting 3 s to click a visible Skip button
      const { player, clicks, startAd, showSkipButton, hideSkipButton } =
        loadPlayer();
      startAd();
      showSkipButton();
      const settings = { enabled: true, delaySec: 3 };
      const skipper = createSkipper({ getSettings: () => settings });
      skipper.check(player);
      // WHEN the delay changes to 8 s during the wait
      settings.delaySec = 8;
      vi.advanceTimersByTime(3000);
      // THEN the running wait still clicks after 3 s
      expect(clicks).toHaveBeenCalledOnce();
      // WHEN the next ad shows its Skip button
      hideSkipButton();
      skipper.check(player);
      showSkipButton();
      skipper.check(player);
      // THEN it waits the new 8 s
      vi.advanceTimersByTime(7999);
      expect(clicks).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(1);
      expect(clicks).toHaveBeenCalledTimes(2);
    });
  });

  describe('counting skips', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([{ delaySec: 0 }, { delaySec: 3 }])(
      'calls onSkip once for each click it makes, with or without a delay ($delaySec s)',
      ({ delaySec }) => {
        // GIVEN an ad shows its Skip button, and a skipper that reports skips
        const { player, clicks, startAd, showSkipButton } = loadPlayer();
        startAd();
        showSkipButton();
        const onSkip = vi.fn();
        const getSettings = () => ({ enabled: true, delaySec });
        // WHEN the skipper checks the player and the delay passes
        createSkipper({ getSettings, onSkip }).check(player);
        expect(onSkip).toHaveBeenCalledTimes(delaySec === 0 ? 1 : 0);
        vi.advanceTimersByTime(delaySec * 1000);
        // THEN it reported exactly the one click it made
        expect(clicks).toHaveBeenCalledOnce();
        expect(onSkip).toHaveBeenCalledOnce();
      },
    );

    it('calls onSkip once for each ad of a pod', () => {
      // GIVEN the first ad of a pod shows its Skip button
      const { player, startAd, showSkipButton, hideSkipButton } = loadPlayer();
      startAd();
      showSkipButton();
      const onSkip = vi.fn();
      const skipper = createSkipper({ ...ON, onSkip });
      // WHEN both ads are skipped, the second after its own countdown
      skipper.check(player);
      skipper.check(player);
      hideSkipButton();
      skipper.check(player);
      showSkipButton();
      skipper.check(player);
      // THEN two skips are reported
      expect(onSkip).toHaveBeenCalledTimes(2);
    });
  });
});
