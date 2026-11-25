// Rating ask rules: when the popup asks the user for a store rating, which
// milestone it names, and when a skip opens the popup by itself. Asked at 50
// ads skipped, then again every 100 more, until the user answers with
// "Rate it ★" or ×.
import { RATE_ASK_EVERY, RATE_FIRST_ASK_AT } from '../shared/constants.js';

/**
 * Decides whether the popup shows the rating prompt.
 *
 * @param {number} skipCount Ads skipped so far.
 * @param {boolean} done Whether the user answered it ("Rate it ★" or ×).
 * @returns {boolean} `true` when the prompt should be shown.
 */
export function isAskDue(skipCount, done) {
  return !done && skipCount >= RATE_FIRST_ASK_AT;
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
