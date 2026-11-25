// Shared constants: the log prefix, timing, the settings' storage keys,
// defaults, and limits, the skip counter's key and default, and the rating
// ask's cadence, key, and badge. Storage keys and defaults are defined only
// here.

/** Prefix for every console line the extension writes; easy to filter. */
export const LOG_PREFIX = '[yt-skip-ad]';

/**
 * Wait from the first player change to the check it triggers; changes in
 * between share that check. Well inside the mission's ~0.5 s skip target.
 */
export const CHECK_THROTTLE_MS = 100;

/**
 * The user's settings, as stored in `chrome.storage.local`.
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

/** Storage keys of the settings, in `chrome.storage.local`. */
export const SETTING_KEYS = Object.freeze(Object.keys(DEFAULT_SETTINGS));

/** Shortest allowed delay before clicking Skip, in seconds. */
export const DELAY_SEC_MIN = 0;

/** Longest allowed delay before clicking Skip, in seconds. */
export const DELAY_SEC_MAX = 10;

/**
 * Storage key of the skip counter, in `chrome.storage.local`: kept per
 * device, not synced.
 */
export const SKIP_COUNT_KEY = 'skipCount';

/** Value of the skip counter when it is missing or invalid in storage. */
export const DEFAULT_SKIP_COUNT = 0;

/** The extension's reviews page on the Chrome Web Store. */
export const STORE_REVIEWS_URL =
  'https://chromewebstore.google.com/detail/kdembckigpophgcgjfmbenkgnnkdoofe/reviews';

/**
 * Ads skipped before the popup first asks for a rating; the first auto-open
 * milestone.
 */
export const RATE_FIRST_ASK_AT = 50;

/**
 * Ads skipped between auto-open milestones (50, 150, 250, …) while the
 * rating prompt stays unanswered.
 */
export const RATE_ASK_EVERY = 100;

/** Text of the toolbar badge shown when the popup could not open itself. */
export const RATE_BADGE_TEXT = '★';

/**
 * Storage key of the rating prompt's answer, in `chrome.storage.local`:
 * `true` once the user rated or closed it, so it is never asked again.
 */
export const RATE_PROMPT_DONE_KEY = 'ratePromptDone';
