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
