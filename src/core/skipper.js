// Decides when to click the Skip button. Each check looks at the player as it
// is right now; the content script decides when to check.
//
// Click once per appearance: the skipper starts armed, a click disarms it,
// and any check that sees no visible Skip button re-arms it. In a two-ad pod
// the second ad's countdown hides the button, so that ad gets its own click,
// whether YouTube reuses the button element or makes a new one.
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
  return {
    check(player) {
      const button = findSkipButton(player);
      if (!button) {
        armed = true;
        return;
      }
      // Staying armed while off lets turning auto-skip on click this button.
      const { enabled, delaySec } = getSettings();
      if (!armed || !isAdShowing(player) || !enabled) return;
      armed = false;
      if (delaySec === 0) {
        button.click();
        return;
      }
      setTimeout(() => button.click(), delaySec * 1000);
    },
  };
}
