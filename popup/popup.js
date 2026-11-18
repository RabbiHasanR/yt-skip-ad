// Popup wiring: shows the stored settings in the controls and saves changes.
// The rules live in src/core/; storage access in src/shared/storage.js.
import { getSettings } from '../src/shared/storage.js';

const enabledInput = /** @type {HTMLInputElement} */ (
  document.getElementById('enabled')
);
const delayInput = /** @type {HTMLInputElement} */ (
  document.getElementById('delay')
);

const settings = await getSettings();
enabledInput.checked = settings.enabled;
delayInput.value = String(settings.delaySec);
