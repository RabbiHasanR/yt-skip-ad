// Storage adapter: the only file that touches `chrome.storage`. Reads, saves,
// and follows the settings, the skip counter, and the rating prompt state in
// the `local` area, each cleaned up by its rules in src/core/. Nothing is
// kept in `sync`, so Chrome Sync never copies anything off the device.
import { normalizeSettings } from '../core/settings.js';
import { normalizeSkipCount } from '../core/skip-count.js';
import {
  DEFAULT_SETTINGS,
  DEFAULT_SKIP_COUNT,
  RATE_PROMPT_DONE_KEY,
  SETTING_KEYS,
  SKIP_COUNT_KEY,
} from './constants.js';

/**
 * Reads the settings once.
 *
 * @returns {Promise<import('./constants.js').Settings>} The stored settings,
 *   with defaults for missing or invalid values.
 */
export async function getSettings() {
  await moveSettingsFromSync();
  return normalizeSettings(await chrome.storage.local.get(DEFAULT_SETTINGS));
}

/**
 * Moves settings that 1.0.0 kept in `sync` to `local`, then removes them from
 * `sync`, which also removes Chrome Sync's copy. A setting already in `local`
 * is newer and is kept. When `sync` holds no setting, nothing is written.
 *
 * @returns {Promise<void>} Resolves once `sync` holds no setting.
 */
async function moveSettingsFromSync() {
  const synced = await chrome.storage.sync.get([...SETTING_KEYS]);
  const keys = Object.keys(synced);
  if (keys.length === 0) return;
  const local = await chrome.storage.local.get(keys);
  const missing = keys.filter((key) => !(key in local));
  if (missing.length > 0) {
    await chrome.storage.local.set(
      Object.fromEntries(missing.map((key) => [key, synced[key]])),
    );
  }
  await chrome.storage.sync.remove(keys);
}

/**
 * Saves some of the settings, cleaned up first. Keys not given keep their
 * stored values.
 *
 * @param {Partial<import('./constants.js').Settings>} changes The settings
 *   to save.
 * @returns {Promise<void>} Resolves once they are stored.
 */
export async function setSettings(changes) {
  const clean = normalizeSettings(changes);
  await chrome.storage.local.set(
    Object.fromEntries(
      Object.keys(changes).map((key) => [
        key,
        clean[/** @type {keyof typeof clean} */ (key)],
      ]),
    ),
  );
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
  chrome.storage.onChanged.addListener((changes, areaName) => {
    // The skip counter shares `local`; a counted skip is not a settings change.
    if (areaName !== 'local' || !SETTING_KEYS.some((key) => key in changes)) {
      return;
    }
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

/**
 * Reads the skip counter once.
 *
 * @returns {Promise<number>} The stored count, or 0 when missing or invalid.
 */
export async function getSkipCount() {
  const stored = await chrome.storage.local.get({
    [SKIP_COUNT_KEY]: DEFAULT_SKIP_COUNT,
  });
  return normalizeSkipCount(stored[SKIP_COUNT_KEY]);
}

/**
 * Adds 1 to the skip counter. Read, add, write, with no lock: two tabs
 * counting at the same moment can lose one count.
 *
 * @returns {Promise<void>} Resolves once the new count is stored.
 */
export async function incrementSkipCount() {
  const count = await getSkipCount();
  await chrome.storage.local.set({ [SKIP_COUNT_KEY]: count + 1 });
}

/**
 * Sets the skip counter back to 0.
 *
 * @returns {Promise<void>} Resolves once 0 is stored.
 */
export async function resetSkipCount() {
  await chrome.storage.local.set({ [SKIP_COUNT_KEY]: DEFAULT_SKIP_COUNT });
}

/**
 * Calls `listener` with the new skip count after each change in storage.
 *
 * @param {(count: number) => void} listener Gets the cleaned-up count.
 */
export function watchSkipCount(listener) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    // A settings save says nothing about the count.
    if (areaName !== 'local' || !(SKIP_COUNT_KEY in changes)) return;
    listener(normalizeSkipCount(changes[SKIP_COUNT_KEY].newValue));
  });
}

/**
 * Reads whether the user already rated or dismissed the rating prompt.
 *
 * @returns {Promise<boolean>} `true` once handled; `false` when missing or
 *   invalid.
 */
export async function isRatePromptDone() {
  const stored = await chrome.storage.local.get({
    [RATE_PROMPT_DONE_KEY]: false,
  });
  return stored[RATE_PROMPT_DONE_KEY] === true;
}

/**
 * Remembers that the user rated or dismissed the rating prompt, so it is
 * never shown again.
 *
 * @returns {Promise<void>} Resolves once stored.
 */
export async function markRatePromptDone() {
  await chrome.storage.local.set({ [RATE_PROMPT_DONE_KEY]: true });
}
