import { describe, expect, it } from 'vitest';
import { getSettings } from '../../src/shared/storage.js';

describe('settings storage', () => {
  it('reads auto-skip on with no delay when nothing is stored', async () => {
    // GIVEN a fresh install: nothing is stored yet
    // WHEN the settings are read
    const settings = await getSettings();
    // THEN auto-skip is on with no delay
    expect(settings).toEqual({ enabled: true, delaySec: 0 });
  });
});
