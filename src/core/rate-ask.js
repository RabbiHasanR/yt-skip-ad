// Rating ask rules: when the popup asks the user for a store rating, and
// when a skip opens the popup by itself. Asked at 50 ads skipped, then again
// every 100 more until the user says "Don't ask again".

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
