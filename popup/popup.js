// Popup wiring: shows the stored settings in the controls and saves changes.
// The rules live in src/core/; storage access in src/shared/storage.js.
import { isAskDue, nextAskAfter, promptCount } from '../src/core/rate-ask.js';
import { parseDelayField } from '../src/core/settings.js';
import { STORE_REVIEWS_URL } from '../src/shared/constants.js';
import {
  getRateAsk,
  getSettings,
  getSkipCount,
  postponeRateAsk,
  resetSkipCount,
  setSettings,
  stopRateAsk,
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
const rateNever = /** @type {HTMLButtonElement} */ (
  document.getElementById('rate-never')
);

const rateCount = /** @type {HTMLElement} */ (
  document.getElementById('rate-count')
);

// Store links live in constants.js, filled in here.
document.querySelectorAll('[data-store-reviews]').forEach((link) => {
  /** @type {HTMLAnchorElement} */ (link).href = STORE_REVIEWS_URL;
});

let rateAsk = await getRateAsk();
let skipCount = 0;

/**
 * Shows a skip count in the counter.
 *
 * @param {number} count Ads skipped so far.
 */
const showCount = (count) => {
  skipCount = count;
  countOutput.value = count.toLocaleString();
  showRatePrompt();
};

/** Shows the rating prompt when it is due, naming the last milestone. */
const showRatePrompt = () => {
  ratePrompt.hidden = !isAskDue(skipCount, rateAsk);
  rateCount.textContent = String(promptCount(skipCount));
};

/** Hides the rating prompt until 100 more ads are skipped. */
const postponeRatePrompt = () => {
  rateAsk = { ...rateAsk, nextAskAt: nextAskAfter(skipCount) };
  showRatePrompt();
  postponeRateAsk(skipCount);
};

/** Hides the rating prompt for good: this popup and every later one. */
const stopRatePrompt = () => {
  rateAsk = { ...rateAsk, neverAsk: true };
  showRatePrompt();
  stopRateAsk();
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

// The link still opens the reviews page. The extension can't see whether a
// review was written, so Rate postpones like ×.
rateLink.addEventListener('click', postponeRatePrompt);
rateDismiss.addEventListener('click', postponeRatePrompt);
rateNever.addEventListener('click', stopRatePrompt);
