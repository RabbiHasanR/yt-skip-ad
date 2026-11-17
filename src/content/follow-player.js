// Content wiring: follows YouTube's player and asks the skipper to check it.
// The rules live in src/core/; this file only connects them to the page.
import { findPlayer } from '../core/ad-detection.js';
import { createSkipper } from '../core/skipper.js';

/**
 * Starts auto-skip on a page.
 *
 * @param {Document} doc The page's document.
 * @returns {() => void} Stops following the page.
 */
export function followPlayer(doc) {
  const player = findPlayer(doc);
  if (player) createSkipper().check(player);
  return () => {};
}
