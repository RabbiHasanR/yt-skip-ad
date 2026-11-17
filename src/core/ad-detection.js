// Reads YouTube's player DOM: is an ad showing, and is its Skip button
// clickable? Pure lookups on the elements it is given; no clicking, no state.
import { SKIP_BUTTON_SELECTORS } from './selectors.js';

/**
 * Finds the Skip button inside the player.
 *
 * @param {Element} player The video player element.
 * @returns {HTMLElement | null} The Skip button, or null if there is none.
 */
export function findSkipButton(player) {
  for (const selector of SKIP_BUTTON_SELECTORS) {
    const button = /** @type {HTMLElement | null} */ (
      player.querySelector(selector)
    );
    if (button) return button;
  }
  return null;
}
