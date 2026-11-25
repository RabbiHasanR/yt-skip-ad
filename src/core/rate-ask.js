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

/**
 * Decides whether a change of the skip count crosses an auto-open milestone
 * (50, 150, 250, …): one lies after the old count and at or below the new
 * one. A reset, or a skip between milestones, crosses none.
 *
 * @param {number} oldCount Ads skipped before the change.
 * @param {number} newCount Ads skipped after it.
 * @returns {boolean} `true` when the popup should open by itself.
 */
export function crossedMilestone(oldCount, newCount) {
  const nextMilestone =
    oldCount < RATE_FIRST_ASK_AT
      ? RATE_FIRST_ASK_AT
      : promptCount(oldCount) + RATE_ASK_EVERY;
  return newCount >= nextMilestone;
}
