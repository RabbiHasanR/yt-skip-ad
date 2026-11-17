// Content wiring: follows YouTube's player and asks the skipper to check it.
// The rules live in src/core/; this file only connects them to the page.
import { findPlayer } from '../core/ad-detection.js';
import { createSkipper } from '../core/skipper.js';
import { createThrottle } from '../core/throttle.js';
import { CHECK_THROTTLE_MS } from '../shared/constants.js';

/**
 * Player changes that can start or end an ad, or show or hide the Skip
 * button: `ad-showing` on the player, the button being added, and the button
 * being revealed by a class, inline style, or `hidden` change.
 */
const PLAYER_CHANGES = {
  subtree: true,
  childList: true,
  attributeFilter: ['class', 'style', 'hidden'],
};

/**
 * Starts auto-skip on a page.
 *
 * @param {Document} doc The page's document.
 * @returns {() => void} Stops following the page.
 */
export function followPlayer(doc) {
  const player = findPlayer(doc);
  if (!player) return () => {};
  const skipper = createSkipper();
  const checkSoon = createThrottle(
    () => skipper.check(player),
    CHECK_THROTTLE_MS,
  );
  const observer = new MutationObserver(checkSoon);
  observer.observe(player, PLAYER_CHANGES);
  skipper.check(player);
  return () => observer.disconnect();
}
