// Background service worker: opens the popup by itself when a skip crosses a
// rating milestone. The rules live in src/core/; storage access in
// src/shared/storage.js. Listeners are added at the top level, so Chrome
// finds them when a storage change wakes the worker.
import { crossedMilestone } from '../core/rate-ask.js';
import { isRatePromptDone, watchSkipCountChange } from '../shared/storage.js';

watchSkipCountChange(async (oldCount, newCount) => {
  if (!crossedMilestone(oldCount, newCount)) return;
  // An answered prompt ("Rate it ★" or ×) is never asked again.
  if (await isRatePromptDone()) return;
  await chrome.action.openPopup();
});
