// Shared constants: the log prefix, timing, and the settings' storage keys,
// defaults, and limits. Storage keys and defaults are defined only here.

/** Prefix for every console line the extension writes; easy to filter. */
export const LOG_PREFIX = '[yt-skip-ad]';

/**
 * Wait from the first player change to the check it triggers; changes in
 * between share that check. Well inside the mission's ~0.5 s skip target.
 */
export const CHECK_THROTTLE_MS = 100;

/**
 * The user's settings, as stored in `chrome.storage.sync`.
 *
 * @typedef {object} Settings
 * @property {boolean} enabled Whether auto-skip is on.
 * @property {number} delaySec Whole seconds to wait before clicking Skip.
 */

/**
 * Value of each setting when it is missing or invalid in storage. Its keys
 * are the storage keys.
 *
 * @type {Readonly<Settings>}
 */
export const DEFAULT_SETTINGS = Object.freeze({ enabled: true, delaySec: 0 });

/** Storage keys of the settings, in `chrome.storage.sync`. */
export const SETTING_KEYS = Object.freeze(Object.keys(DEFAULT_SETTINGS));

/** Shortest allowed delay before clicking Skip, in seconds. */
export const DELAY_SEC_MIN = 0;

/** Longest allowed delay before clicking Skip, in seconds. */
export const DELAY_SEC_MAX = 10;
