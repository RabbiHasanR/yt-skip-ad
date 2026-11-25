// Background service worker: opens the popup by itself when a skip crosses a
// rating milestone, or shows a ★ badge when it can't. The rules live in
// src/core/; storage access in src/shared/storage.js. Listeners are added at
// the top level, so Chrome finds them when a storage change wakes the worker.
import { canOpenPopupIn, crossedMilestone } from '../core/rate-ask.js';
import { RATE_BADGE_TEXT } from '../shared/constants.js';
import { isRatePromptDone, watchSkipCountChange } from '../shared/storage.js';

watchSkipCountChange(async (oldCount, newCount) => {
  if (!crossedMilestone(oldCount, newCount)) return;
  // An answered prompt ("Rate it ★" or ×) is never asked again.
  if (await isRatePromptDone()) return;
  if (!canOpenPopupIn(await chrome.windows.getLastFocused())) {
    // A fullscreen video, or another app in front: wait on the icon instead.
    await chrome.action.setBadgeText({ text: RATE_BADGE_TEXT });
    return;
  }
  await chrome.action.openPopup();
});
