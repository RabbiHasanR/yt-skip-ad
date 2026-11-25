import { describe, expect, it } from 'vitest';
import { isAskDue } from '../../src/core/rate-ask.js';

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
});
