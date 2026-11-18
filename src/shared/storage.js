// Storage adapter: the only file that touches `chrome.storage`. Reads and
// follows the settings in the `sync` area, cleaned up by the settings rules.
import { normalizeSettings } from '../core/settings.js';
import { DEFAULT_SETTINGS } from './constants.js';

/**
 * Reads the settings once.
 *
 * @returns {Promise<import('./constants.js').Settings>} The stored settings,
 *   with defaults for missing or invalid values.
 */
export async function getSettings() {
  return normalizeSettings(await chrome.storage.sync.get(DEFAULT_SETTINGS));
}

/**
 * Settings that keep up with storage.
 *
 * @typedef {object} LiveSettings
 * @property {() => import('./constants.js').Settings} current The settings
 *   as they are now.
 * @property {(listener: (settings: import('./constants.js').Settings) => void) => void} onChange
 *   Calls `listener` with the new settings after each change in storage.
 */

/**
 * Reads the settings, then keeps following their changes in storage.
 *
 * @returns {Promise<LiveSettings>} Settings that stay up to date.
 */
export async function watchSettings() {
  let current = await getSettings();
  /** @type {Set<(settings: import('./constants.js').Settings) => void>} */
  const listeners = new Set();
  chrome.storage.onChanged.addListener((changes) => {
    current = normalizeSettings({ ...current, ...newValues(changes) });
    listeners.forEach((listener) => listener(current));
  });
  return {
    current: () => current,
    onChange: (listener) => {
      listeners.add(listener);
    },
  };
}

/**
 * Picks the new value of each changed key; a removed key has none.
 *
 * @param {Record<string, chrome.storage.StorageChange>} changes What changed.
 * @returns {Record<string, unknown>} Each changed key and its new value.
 */
function newValues(changes) {
  return Object.fromEntries(
    Object.entries(changes).map(([key, change]) => [key, change.newValue]),
  );
}
