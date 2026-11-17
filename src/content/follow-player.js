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

/** Page changes that can add a player while we wait for one. */
const PAGE_CHANGES = { subtree: true, childList: true };

/**
 * Starts auto-skip on a page.
 *
 * @param {Document} doc The page's document.
 * @returns {() => void} Stops following the page.
 */
export function followPlayer(doc) {
  const skipper = createSkipper();
  /** @type {MutationObserver | null} */
  let playerObserver = null;
  // Throttled too: on the home page there is never a player, and YouTube
  // changes the page constantly.
  const waiter = new MutationObserver(
    createThrottle(follow, CHECK_THROTTLE_MS),
  );

  /** Watches the page's player, or waits for one to appear. */
  function follow() {
    const player = findPlayer(doc);
    if (!player) {
      waiter.observe(doc.documentElement, PAGE_CHANGES);
      return;
    }
    waiter.disconnect();
    watch(player);
  }

  /**
   * Checks the player now, and again after each burst of player changes.
   *
   * @param {Element} player The video player element.
   */
  function watch(player) {
    playerObserver = new MutationObserver(
      createThrottle(() => skipper.check(player), CHECK_THROTTLE_MS),
    );
    playerObserver.observe(player, PLAYER_CHANGES);
    skipper.check(player);
  }

  follow();
  return () => {
    waiter.disconnect();
    playerObserver?.disconnect();
  };
}
