import { describe, expect, it } from 'vitest';
import { normalizeSettings, parseDelayField } from '../../src/core/settings.js';

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

  it.each([
    { key: 'delaySec', label: 'missing', value: undefined, expected: 0 },
    { key: 'delaySec', label: 'the text "5"', value: '5', expected: 0 },
    { key: 'delaySec', label: 'null', value: null, expected: 0 },
    { key: 'delaySec', label: 'true', value: true, expected: 0 },
    { key: 'delaySec', label: 'NaN', value: NaN, expected: 0 },
    { key: 'delaySec', label: 'Infinity', value: Infinity, expected: 0 },
    { key: 'enabled', label: 'missing', value: undefined, expected: true },
    {
      key: 'enabled',
      label: 'the text "false"',
      value: 'false',
      expected: true,
    },
    { key: 'enabled', label: '0', value: 0, expected: true },
    { key: 'enabled', label: 'null', value: null, expected: true },
  ])(
    'uses the default when the stored $key is $label',
    ({ key, value, expected }) => {
      // GIVEN a setting of the wrong type, or none, as found in storage
      // WHEN the settings are cleaned up
      const settings = normalizeSettings({ [key]: value });
      // THEN that setting is its default, and nothing is thrown
      expect(settings[/** @type {'delaySec' | 'enabled'} */ (key)]).toBe(
        expected,
      );
    },
  );

  it.each([
    { typed: '', expected: null },
    { typed: '4', expected: 4 },
    { typed: '25', expected: 10 },
    { typed: '2.6', expected: 3 },
  ])('reads a delay field of "$typed" as $expected', ({ typed, expected }) => {
    // GIVEN what a colleague left in the popup's delay field
    // WHEN the field is read
    const delaySec = parseDelayField(typed);
    // THEN it is a valid delay, or null when there is nothing to save
    expect(delaySec).toBe(expected);
  });
});
