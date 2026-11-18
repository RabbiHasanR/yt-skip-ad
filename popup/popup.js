// Popup wiring: shows the stored settings in the controls and saves changes.
// The rules live in src/core/; storage access in src/shared/storage.js.
import { parseDelayField } from '../src/core/settings.js';
import {
  getSettings,
  getSkipCount,
  setSettings,
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
countOutput.value = String(await getSkipCount());

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
