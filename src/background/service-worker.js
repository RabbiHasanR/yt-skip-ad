// Background service worker: opens the popup by itself when a skip crosses a
// rating milestone, or shows a ★ badge when it can't. The rules live in
// src/core/; storage access in src/shared/storage.js. Listeners are added at
// the top level, so Chrome finds them when a storage change wakes the worker.
import { canOpenPopupIn, crossedMilestone } from '../core/rate-ask.js';
import { LOG_PREFIX, RATE_BADGE_TEXT } from '../shared/constants.js';
import { isRatePromptDone, watchSkipCountChange } from '../shared/storage.js';

/** Shows the ★ badge on the toolbar icon: a rating ask is waiting. */
const showRateBadge = () =>
  chrome.action.setBadgeText({ text: RATE_BADGE_TEXT });

/**
 * Asks for a rating when a skip count change crosses a milestone: opens the
 * popup, or shows the ★ badge when it can't.
 *
 * @param {number} oldCount Ads skipped before the change.
 * @param {number} newCount Ads skipped after it.
 * @returns {Promise<void>} Resolves once the popup or badge is handled.
 */
async function askForRating(oldCount, newCount) {
  if (!crossedMilestone(oldCount, newCount)) return;
  // An answered prompt ("Rate it ★" or ×) is never asked again.
  if (await isRatePromptDone()) return;
  // A fullscreen video, or another app in front: wait on the icon instead.
  if (!canOpenPopupIn(await chrome.windows.getLastFocused())) {
    await showRateBadge();
    return;
  }
  // Chrome can still refuse (the window changed meanwhile): same fallback.
  await chrome.action.openPopup().catch(showRateBadge);
}

// A failure is logged, never thrown: the next milestone tries again.
watchSkipCountChange((oldCount, newCount) =>
  askForRating(oldCount, newCount).catch((error) =>
    console.error(`${LOG_PREFIX} rating auto-open failed`, error),
  ),
);
