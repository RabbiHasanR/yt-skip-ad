import { describe, expect, it } from 'vitest';
import { shouldShowRatePrompt } from '../../src/core/rate-prompt.js';
import { RATE_PROMPT_THRESHOLD } from '../../src/shared/constants.js';

describe('rating prompt rules', () => {
  it.each([
    { count: 0, done: false, expected: false },
    { count: RATE_PROMPT_THRESHOLD - 1, done: false, expected: false },
    { count: RATE_PROMPT_THRESHOLD, done: false, expected: true },
    { count: RATE_PROMPT_THRESHOLD * 10, done: false, expected: true },
    { count: RATE_PROMPT_THRESHOLD, done: true, expected: false },
  ])(
    'with $count ads skipped and done=$done, shows it: $expected',
    ({ count, done, expected }) => {
      // GIVEN a skip count and whether the prompt was already handled
      // WHEN the popup decides whether to ask for a rating
      const show = shouldShowRatePrompt(count, done);
      // THEN it asks only past the threshold, and never once handled
      expect(show).toBe(expected);
    },
  );
});
