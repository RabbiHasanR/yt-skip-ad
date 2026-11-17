// Reads YouTube's player DOM: is an ad showing, and is its Skip button
// clickable? Pure lookups on the elements it is given; no clicking, no state.
import {
  AD_SHOWING_CLASS,
  PLAYER_SELECTORS,
  SKIP_BUTTON_SELECTORS,
} from './selectors.js';

/**
 * Finds the main video player, trying each player selector in order.
 *
 * @param {ParentNode} root Where to look, usually the page's document.
 * @returns {Element | null} The player, or null on pages without one.
 */
export function findPlayer(root) {
  return findFirst(root, PLAYER_SELECTORS, () => true);
}

/**
 * Tells whether an ad is playing in the player.
 *
 * @param {Element} player The video player element.
 * @returns {boolean} True while YouTube marks the player as showing an ad.
 */
export function isAdShowing(player) {
  return player.classList.contains(AD_SHOWING_CLASS);
}

/**
 * Finds a visible Skip button inside the player.
 *
 * @param {Element} player The video player element.
 * @returns {HTMLElement | null} The first visible Skip button, or null.
 */
export function findSkipButton(player) {
  return /** @type {HTMLElement | null} */ (
    findFirst(player, SKIP_BUTTON_SELECTORS, (button) =>
      isVisible(button, player),
    )
  );
}

/**
 * Finds the first element that matches a selector and is accepted, trying
 * the selectors in priority order.
 *
 * @param {ParentNode} root Where to look.
 * @param {string[]} selectors CSS selectors, most preferred first.
 * @param {(element: Element) => boolean} accept Extra condition to meet.
 * @returns {Element | null} The first accepted match, or null.
 */
function findFirst(root, selectors, accept) {
  for (const selector of selectors) {
    for (const element of root.querySelectorAll(selector)) {
      if (accept(element)) return element;
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
