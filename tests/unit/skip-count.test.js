import { describe, expect, it } from 'vitest';
import { normalizeSkipCount } from '../../src/core/skip-count.js';

describe('skip counter rules', () => {
  it.each([
    { stored: 4, expected: 4 },
    { stored: 0, expected: 0 },
    { stored: 2.7, expected: 2 },
    { stored: -1, expected: 0 },
    { stored: NaN, expected: 0 },
    { stored: Infinity, expected: 0 },
    { stored: '5', expected: 0 },
    { stored: null, expected: 0 },
    { stored: undefined, expected: 0 },
  ])('reads a stored count of $stored as $expected', ({ stored, expected }) => {
    // GIVEN a count found in storage, valid or not
    // WHEN it is cleaned up
    const count = normalizeSkipCount(stored);
    // THEN it is a whole number of skips, 0 when it can't be trusted
    expect(count).toBe(expected);
  });
});
