// Popup wiring: shows the stored settings in the controls and saves changes.
// The rules live in src/core/; storage access in src/shared/storage.js.
import { isAskDue, promptCount } from '../src/core/rate-ask.js';
import { parseDelayField } from '../src/core/settings.js';
import { STORE_REVIEWS_URL } from '../src/shared/constants.js';
import {
  getRateAsk,
  getSettings,
  getSkipCount,
  markRatePromptDone,
  resetSkipCount,
  setSettings,
  watchSkipCount,
} from '../src/shared/storage.js';

const enabledInput = /** @type {HTMLInputElement} */ (
  document.getElementById('enabled')
);
const delayInput = /** @type {HTMLInputElement} */ (
  document.getElementById('delay')
);
const countOutput = /** @type {HTMLOutputElement} */ (
  document.getElementById('skip-count')
);
const resetButton = /** @type {HTMLButtonElement} */ (
  document.getElementById('reset-count')
);
const ratePrompt = /** @type {HTMLElement} */ (
  document.getElementById('rate-prompt')
);
const rateLink = /** @type {HTMLAnchorElement} */ (
  document.getElementById('rate-link')
);
const rateDismiss = /** @type {HTMLButtonElement} */ (
  document.getElementById('rate-dismiss')
);

const rateCount = /** @type {HTMLElement} */ (
  document.getElementById('rate-count')
);

// Store links live in constants.js, filled in here.
document.querySelectorAll('[data-store-reviews]').forEach((link) => {
  /** @type {HTMLAnchorElement} */ (link).href = STORE_REVIEWS_URL;
});

const rateAsk = await getRateAsk();
let ratePromptDone = false;

/**
 * Shows a skip count in the counter.
 *
 * @param {number} count Ads skipped so far.
 */
const showCount = (count) => {
  countOutput.value = count.toLocaleString();
  ratePrompt.hidden = ratePromptDone || !isAskDue(count, rateAsk);
  rateCount.textContent = String(promptCount(count));
};

/** Hides the rating prompt for good: this popup and every later one. */
const finishRatePrompt = () => {
  ratePromptDone = true;
  ratePrompt.hidden = true;
  markRatePromptDone();
};

/**
 * Shows a delay in the delay field.
 *
 * @param {number} delaySec Whole seconds.
 */
const showDelay = (delaySec) => {
  delayInput.value = String(delaySec);
};

const settings = await getSettings();
enabledInput.checked = settings.enabled;
showDelay(settings.delaySec);
showCount(await getSkipCount());
watchSkipCount(showCount);

enabledInput.addEventListener('change', () => {
  setSettings({ enabled: enabledInput.checked });
});

delayInput.addEventListener('change', async () => {
  const delaySec = parseDelayField(delayInput.value);
  if (delaySec === null) {
    // Nothing to save: show the stored delay again.
    showDelay((await getSettings()).delaySec);
    return;
  }
  showDelay(delaySec);
  await setSettings({ delaySec });
});

// No confirmation: one click, low stakes. The counter shows 0 through
// watchSkipCount, as for any other change.
resetButton.addEventListener('click', () => {
  resetSkipCount();
});

// The link still opens the reviews page; the prompt just never comes back.
rateLink.addEventListener('click', finishRatePrompt);
rateDismiss.addEventListener('click', finishRatePrompt);
