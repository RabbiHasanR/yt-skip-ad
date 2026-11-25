import { describe, expect, it } from 'vitest';
import {
  isAskDue,
  normalizeRateAsk,
  promptCount,
} from '../../src/core/rate-ask.js';
import { RATE_FIRST_ASK_AT } from '../../src/shared/constants.js';

describe('rating ask rules', () => {
  it.each([
    { count: 0, nextAskAt: 50, neverAsk: false, expected: false },
    { count: 49, nextAskAt: 50, neverAsk: false, expected: false },
    { count: 50, nextAskAt: 50, neverAsk: false, expected: true },
    { count: 149, nextAskAt: 150, neverAsk: false, expected: false },
    { count: 150, nextAskAt: 150, neverAsk: false, expected: true },
    { count: 5000, nextAskAt: 150, neverAsk: false, expected: true },
    { count: 5000, nextAskAt: 50, neverAsk: true, expected: false },
  ])(
    'with $count skipped, next ask $nextAskAt, never $neverAsk: due $expected',
    ({ count, nextAskAt, neverAsk, expected }) => {
      // GIVEN a skip count and the stored ask state
      // WHEN the popup decides whether to ask for a rating
      const due = isAskDue(count, { nextAskAt, neverAsk });
      // THEN it asks from the next ask on, and never after "Don't ask again"
      expect(due).toBe(expected);
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
