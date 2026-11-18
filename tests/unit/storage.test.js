import { describe, expect, it, vi } from 'vitest';
import {
  getSettings,
  incrementSkipCount,
  watchSettings,
} from '../../src/shared/storage.js';
import { seedStorage } from '../setup/storage.js';

describe('settings storage', () => {
  it('reads auto-skip on with no delay when nothing is stored', async () => {
    // GIVEN a fresh install: nothing is stored yet
    // WHEN the settings are read
    const settings = await getSettings();
    // THEN auto-skip is on with no delay
    expect(settings).toEqual({ enabled: true, delaySec: 0 });
  });

  it('tells listeners the new settings when they change in storage', async () => {
    // GIVEN the settings are being watched, with a listener
    const settings = await watchSettings();
    const listener = vi.fn();
    settings.onChange(listener);
    // WHEN a colleague turns auto-skip off
    await chrome.storage.sync.set({ enabled: false });
    // THEN the listener gets the new settings, and so does current()
    const expected = { enabled: false, delaySec: 0 };
    expect(listener).toHaveBeenCalledExactlyOnceWith(expected);
    expect(settings.current()).toEqual(expected);
  });

  it('goes back to the default when a setting is removed from storage', async () => {
    // GIVEN a stored delay of 5 seconds, being watched
    await seedStorage({ delaySec: 5 });
    const settings = await watchSettings();
    expect(settings.current().delaySec).toBe(5);
    // WHEN the delay is removed from storage
    await chrome.storage.sync.remove('delaySec');
    // THEN the delay goes back to its default
    expect(settings.current().delaySec).toBe(0);
  });
});

describe('skip counter storage', () => {
  it.each([
    { stored: 4, expected: 5 },
    { stored: undefined, expected: 1 },
    { stored: -3, expected: 1 },
    { stored: 'x', expected: 1 },
    { stored: 2.7, expected: 3 },
  ])(
    'adds 1 to a stored count of $stored, saving $expected',
    async ({ stored, expected }) => {
      // GIVEN a count in storage, valid or not (undefined: none yet)
      if (stored !== undefined)
        await seedStorage({ skipCount: stored }, 'local');
      // WHEN a skip is counted
      await incrementSkipCount();
      // THEN the cleaned-up count plus 1 is saved
      expect(await chrome.storage.local.get({ skipCount: null })).toEqual({
        skipCount: expected,
      });
    },
  );

  it('keeps the skip counter in local storage, never in sync', async () => {
    // GIVEN a fresh install
    // WHEN a skip is counted
    await incrementSkipCount();
    // THEN only this computer's storage changed; nothing went to Chrome Sync
    expect(chrome.storage.local.set).toHaveBeenCalledOnce();
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });
});
