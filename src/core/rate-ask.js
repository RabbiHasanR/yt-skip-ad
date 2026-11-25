// Rating ask rules: when the popup asks the user for a store rating, and
// when a skip opens the popup by itself. Asked at 50 ads skipped, then again
// every 100 more until the user says "Don't ask again".
import { RATE_ASK_EVERY, RATE_FIRST_ASK_AT } from '../shared/constants.js';

/**
 * The stored state of the rating ask.
 *
 * @typedef {object} RateAsk
 * @property {number} nextAskAt Skip count from which the prompt is due.
 * @property {boolean} neverAsk Whether the user said "Don't ask again".
 */

/**
 * Decides whether the popup shows the rating prompt.
 *
 * @param {number} skipCount Ads skipped so far.
 * @param {RateAsk} state The stored ask state.
 * @returns {boolean} `true` when the prompt should be shown.
 */
export function isAskDue(skipCount, state) {
  return !state.neverAsk && skipCount >= state.nextAskAt;
}

/**
 * Cleans up the ask state read from storage. A missing or invalid value is
 * never an error; it becomes the default.
 *
 * @param {{ nextAskAt?: unknown, neverAsk?: unknown }} raw The stored values;
 *   may be missing or invalid.
 * @returns {RateAsk} A valid ask state.
 */
export function normalizeRateAsk(raw) {
  const { nextAskAt, neverAsk } = raw;
  return {
    nextAskAt:
      Number.isInteger(nextAskAt) && /** @type {number} */ (nextAskAt) >= 0
        ? /** @type {number} */ (nextAskAt)
        : RATE_FIRST_ASK_AT,
    neverAsk: neverAsk === true,
  };
}

/**
 * The number the prompt names: the last milestone (50, 150, 250, …) at or
 * below the skip count, so "<number>+ ads skipped" is always true.
 *
 * @param {number} skipCount Ads skipped so far.
 * @returns {number} The milestone; the first ask below 150.
 */
export function promptCount(skipCount) {
  const stepsPast = Math.floor(
    (skipCount - RATE_FIRST_ASK_AT) / RATE_ASK_EVERY,
  );
  return RATE_FIRST_ASK_AT + Math.max(0, stepsPast) * RATE_ASK_EVERY;
}
