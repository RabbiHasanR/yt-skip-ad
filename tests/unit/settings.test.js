import { describe, expect, it } from 'vitest';
import { normalizeSettings } from '../../src/core/settings.js';

describe('settings rules', () => {
  it.each([
    { stored: 15, expected: 10 },
    { stored: -3, expected: 0 },
    { stored: 2.6, expected: 3 },
    { stored: 7, expected: 7 },
  ])('uses a stored delay of $stored as $expected', ({ stored, expected }) => {
    // GIVEN a delay as it was found in storage
    // WHEN the settings are cleaned up
    const settings = normalizeSettings({ delaySec: stored });
    // THEN the delay is a whole number of seconds within 0–10
    expect(settings.delaySec).toBe(expected);
  });
});
