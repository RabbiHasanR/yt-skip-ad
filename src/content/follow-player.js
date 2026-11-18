// Content wiring: follows YouTube's player and asks the skipper to check it.
// The rules live in src/core/; this file only connects them to the page.
import { findPlayer } from '../core/ad-detection.js';
import { NAVIGATE_EVENT } from '../core/selectors.js';
import { createSkipper } from '../core/skipper.js';
import { createThrottle } from '../core/throttle.js';
import { CHECK_THROTTLE_MS, LOG_PREFIX } from '../shared/constants.js';
import { incrementSkipCount } from '../shared/storage.js';

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
 * Adds a skip to the skip counter. A failed save is logged, never thrown at
 * the page: counting must not break skipping.
 */
function countSkip() {
  incrementSkipCount().catch((error) => {
    console.error(`${LOG_PREFIX} failed to save the skip counter`, error);
  });
}

/**
 * Starts auto-skip on a page: follows its player, including across YouTube's
 * in-page navigation, and checks it after each burst of player changes.
 *
 * @param {Document} doc The page's document.
 * @param {import('../shared/storage.js').LiveSettings} settings The user's
 *   settings, kept up to date with storage.
 * @returns {() => void} Stops following the page.
 */
export function followPlayer(doc, settings) {
  /** @type {Element | null} */
  let current = null;
  /** Stops watching the followed player; a no-op until there is one. */
  let unwatch = () => {};
  /** Checks the followed player soon; a no-op until there is one. */
  let scheduleCheck = () => {};
  // Throttled too: on the home page there is never a player, and YouTube
  // changes the page constantly.
  const waiter = new MutationObserver(
    createThrottle(follow, CHECK_THROTTLE_MS),
  );

  /** Watches the page's player if it changed, or waits for one to appear. */
  function follow() {
    const player = findPlayer(doc);
    if (player && player === current) return;
    unwatch();
    current = player;
    if (!player) {
      waiter.observe(doc.documentElement, PAGE_CHANGES);
      return;
    }
    waiter.disconnect();
    watch(player);
  }

  /**
   * Checks the player now, and again after each burst of player changes.
   * Each player gets a fresh skipper, so no state carries over between them,
   * and unwatching calls off the old skipper's pending wait.
   *
   * @param {Element} player The video player element.
   */
  function watch(player) {
    const skipper = createSkipper({
      getSettings: settings.current,
      onSkip: countSkip,
    });
    scheduleCheck = createThrottle(
      () => skipper.check(player),
      CHECK_THROTTLE_MS,
    );
    const observer = new MutationObserver(scheduleCheck);
    observer.observe(player, PLAYER_CHANGES);
    unwatch = () => {
      observer.disconnect();
      skipper.stop();
    };
    skipper.check(player);
  }

  doc.addEventListener(NAVIGATE_EVENT, follow);
  // Turning auto-skip on must skip an ad already on screen.
  settings.onChange(() => scheduleCheck());
  follow();
  return () => {
    doc.removeEventListener(NAVIGATE_EVENT, follow);
    waiter.disconnect();
    unwatch();
  };
}
