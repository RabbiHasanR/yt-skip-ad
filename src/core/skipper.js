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
  return {
    check(player) {
      if (!isAdShowing(player)) return;
      findSkipButton(player)?.click();
    },
  };
}
