// Rating prompt rules: when the popup asks the user for a store rating.
// Asked once, after the extension has proven itself; never again after the
// user rates or dismisses it.
import { RATE_FIRST_ASK_AT } from '../shared/constants.js';

/**
 * Decides whether the popup shows the rating prompt.
 *
 * @param {number} skipCount Ads skipped so far.
 * @param {boolean} done Whether the user already rated or dismissed it.
 * @returns {boolean} `true` when the prompt should be shown.
 */
export function shouldShowRatePrompt(skipCount, done) {
  return !done && skipCount >= RATE_FIRST_ASK_AT;
}
