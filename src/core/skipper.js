// Decides when to click the Skip button. Each check looks at the player as it
// is right now; the content script decides when to check.
//
// Click once per appearance: the skipper starts armed, a click disarms it,
// and any check that sees no visible Skip button re-arms it. In a two-ad pod
// the second ad's countdown hides the button, so that ad gets its own click,
// whether YouTube reuses the button element or makes a new one.
//
// Delay: with a delay, the check that sees the Skip button starts the wait,
// and the click happens only if the ad, the button, and auto-skip are all
// still there when it ends. With a delay of 0 the click happens right away.
import { findSkipButton, isAdShowing } from './ad-detection.js';

/**
 * Creates a skipper for one player.
 *
 * @param {object} options How the skipper reads the user's settings.
 * @param {() => import('../shared/constants.js').Settings} options.getSettings
 *   Returns the settings as they are now.
 * @returns {{ check: (player: Element) => void }} Checks the player and
 *   clicks the Skip button when it should be clicked.
 */
export function createSkipper({ getSettings }) {
  let armed = true;

  /**
   * Clicks the Skip button if the player still shows an ad with a visible
   * Skip button and auto-skip is still on; the page or the settings may have
   * changed during the delay. Otherwise re-arms, so a later check can try
   * again.
   *
   * @param {Element} player The video player element.
   */
  function clickIfStillWanted(player) {
    const button = findSkipButton(player);
    if (button && isAdShowing(player) && getSettings().enabled) {
      button.click();
    } else {
      armed = true;
    }
  }

  return {
    check(player) {
      const button = findSkipButton(player);
      if (!button) {
        armed = true;
        return;
      }
      const { enabled, delaySec } = getSettings();
      // Staying armed while off lets turning auto-skip on click this button.
      if (!armed || !isAdShowing(player) || !enabled) return;
      armed = false;
      if (delaySec === 0) {
        clickIfStillWanted(player);
        return;
      }
      setTimeout(() => clickIfStillWanted(player), delaySec * 1000);
    },
  };
}
