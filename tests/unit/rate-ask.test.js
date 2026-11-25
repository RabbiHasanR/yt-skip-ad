import { describe, expect, it } from 'vitest';
import {
  isAskDue,
  normalizeRateAsk,
  promptCount,
} from '../../src/core/rate-ask.js';
import { RATE_FIRST_ASK_AT } from '../../src/shared/constants.js';

describe('rating ask rules', () => {
  it.each([
    { count: 0, done: false, expected: false },
    { count: RATE_FIRST_ASK_AT - 1, done: false, expected: false },
    { count: RATE_FIRST_ASK_AT, done: false, expected: true },
    { count: 5000, done: false, expected: true },
    { count: 5000, done: true, expected: false },
  ])(
    'with $count skipped and answered=$done, due $expected',
    ({ count, done, expected }) => {
      // GIVEN a skip count and whether the prompt was answered
      // WHEN the popup decides whether to ask for a rating
      // THEN it asks from 50 on, and never once answered
      expect(isAskDue(count, done)).toBe(expected);
    },
  );

  it.each([
    { stored: 0, expected: 0 },
    { stored: 273, expected: 273 },
    ...[undefined, null, -1, 1.5, NaN, Infinity, '200', true].map((stored) => ({
      stored,
      expected: RATE_FIRST_ASK_AT,
    })),
  ])(
    'reads a stored next ask of $stored as $expected',
    ({ stored, expected }) => {
      // GIVEN a next ask in storage, maybe missing or invalid
      // WHEN the ask state is cleaned up
      const { nextAskAt } = normalizeRateAsk({ nextAskAt: stored });
      // THEN a whole number of 0 or more is kept; anything else is the first
      // ask
      expect(nextAskAt).toBe(expected);
    },
  );

  it.each([
    { stored: true, expected: true },
    ...[undefined, null, false, 'true', 1].map((stored) => ({
      stored,
      expected: false,
    })),
  ])(
    'reads a stored "never ask" of $stored as $expected',
    ({ stored, expected }) => {
      // GIVEN a "never ask" in storage, maybe missing or invalid
      // WHEN the ask state is cleaned up
      const { neverAsk } = normalizeRateAsk({ neverAsk: stored });
      // THEN only a real `true` stops the asks
      expect(neverAsk).toBe(expected);
    },
  );

  it.each([
    { count: 0, shown: 50 },
    { count: 50, shown: 50 },
    { count: 149, shown: 50 },
    { count: 150, shown: 150 },
    { count: 249, shown: 150 },
    { count: 250, shown: 250 },
    { count: 1284, shown: 1250 },
  ])('names $count skips as "$shown+"', ({ count, shown }) => {
    // GIVEN a skip count
    // WHEN the prompt says how many ads were skipped
    // THEN it names the last milestone at or below it, so it stays true
    expect(promptCount(count)).toBe(shown);
  });
});
