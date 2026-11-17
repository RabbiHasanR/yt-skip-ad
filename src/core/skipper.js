// Decides when to click the Skip button. Each check looks at the player as it
// is right now; the content script decides when to check.
import { findSkipButton, isAdShowing } from './ad-detection.js';

/**
 * Creates a skipper for one page.
 *
 * @returns {{ check: (player: Element) => void }} Checks the player and
 *   clicks the Skip button when it should be clicked.
 */
export function createSkipper() {
  let armed = true;
  return {
    check(player) {
      if (!armed || !isAdShowing(player)) return;
      const button = findSkipButton(player);
      if (!button) return;
      button.click();
      armed = false;
    },
  };
}
