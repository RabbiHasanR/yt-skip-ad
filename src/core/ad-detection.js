// Reads YouTube's player DOM: is an ad showing, and is its Skip button
// clickable? Pure lookups on the elements it is given; no clicking, no state.
import { SKIP_BUTTON_SELECTORS } from './selectors.js';

/**
 * Finds a visible Skip button inside the player.
 *
 * @param {Element} player The video player element.
 * @returns {HTMLElement | null} The first visible Skip button, or null.
 */
export function findSkipButton(player) {
  for (const selector of SKIP_BUTTON_SELECTORS) {
    for (const button of player.querySelectorAll(selector)) {
      if (isVisible(button, player)) return /** @type {HTMLElement} */ (button);
    }
  }
  return null;
}

/**
 * Tells whether an element inside the player is shown: neither it nor an
 * ancestor up to the player is `display: none` (which covers `hidden`), and
 * it is not `visibility: hidden`. Uses computed style, so it works in jsdom,
 * which has no layout (`offsetParent` is always null there).
 *
 * @param {Element} element An element inside the player.
 * @param {Element} player The video player element.
 * @returns {boolean} True when the element is shown.
 */
function isVisible(element, player) {
  const view = element.ownerDocument.defaultView;
  if (!view || view.getComputedStyle(element).visibility === 'hidden') {
    return false;
  }
  /** @type {Element | null} */
  let node = element;
  while (node) {
    if (view.getComputedStyle(node).display === 'none') return false;
    if (node === player) break;
    node = node.parentElement;
  }
  return true;
}
