import { describe, expect, it, vi } from 'vitest';
import { getSettings, watchSettings } from '../../src/shared/storage.js';
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
