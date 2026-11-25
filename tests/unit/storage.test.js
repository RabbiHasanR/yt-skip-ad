import { describe, expect, it, vi } from 'vitest';
import {
  getRateAsk,
  getSettings,
  incrementSkipCount,
  postponeRateAsk,
  isRatePromptDone,
  markRatePromptDone,
  setSettings,
  stopRateAsk,
  watchSettings,
} from '../../src/shared/storage.js';
import {
  RATE_ASK_EVERY,
  RATE_FIRST_ASK_AT,
} from '../../src/shared/constants.js';
import { seedStorage } from '../setup/storage.js';

describe('settings storage', () => {
  it('keeps the settings in local storage, never in sync', async () => {
    // GIVEN a fresh install
    // WHEN the popup saves both settings
    await setSettings({ enabled: false, delaySec: 4 });
    // THEN they are kept on this computer, and Chrome Sync never gets a copy
    expect(
      await chrome.storage.local.get({ enabled: null, delaySec: null }),
    ).toEqual({ enabled: false, delaySec: 4 });
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });

  it('moves the settings a 1.0.0 install kept in sync to local storage, once', async () => {
    // GIVEN a 1.0.0 install that stored its settings in sync
    await seedStorage({ enabled: false, delaySec: 3 }, 'sync');
    // WHEN the settings are read after the upgrade
    const settings = await getSettings();
    // THEN they are kept, now in local storage, and gone from sync
    expect(settings).toEqual({ enabled: false, delaySec: 3 });
    expect(
      await chrome.storage.local.get({ enabled: null, delaySec: null }),
    ).toEqual({ enabled: false, delaySec: 3 });
    expect(
      await chrome.storage.sync.get({ enabled: null, delaySec: null }),
    ).toEqual({ enabled: null, delaySec: null });
  });

  it('never lets an old sync value overwrite a setting already in local storage', async () => {
    // GIVEN a delay of 5 saved locally, and a stale delay of 2 left in sync
    await seedStorage({ delaySec: 5 }, 'local');
    await seedStorage({ delaySec: 2 }, 'sync');
    // WHEN the settings are read
    const settings = await getSettings();
    // THEN the local delay wins, and the stale one is removed from sync
    expect(settings.delaySec).toBe(5);
    expect(await chrome.storage.sync.get({ delaySec: null })).toEqual({
      delaySec: null,
    });
  });

  it('writes nothing to storage when a fresh install reads its settings', async () => {
    // GIVEN a fresh install: nothing is stored anywhere
    // WHEN the settings are read
    await getSettings();
    // THEN nothing was written to either area
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
    expect(chrome.storage.sync.remove).not.toHaveBeenCalled();
  });

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
    await chrome.storage.local.set({ enabled: false });
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
    await chrome.storage.local.remove('delaySec');
    // THEN the delay goes back to its default
    expect(settings.current().delaySec).toBe(0);
  });

  it('does not tell settings listeners about a skip counter change', async () => {
    // GIVEN the settings are being watched, with a listener
    const settings = await watchSettings();
    const listener = vi.fn();
    settings.onChange(listener);
    // WHEN a skip is counted
    await incrementSkipCount();
    // THEN the settings listener is not called
    expect(listener).not.toHaveBeenCalled();
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

describe('rating prompt storage', () => {
  it('reads a fresh install as not done', async () => {
    // GIVEN a fresh install
    // WHEN the popup reads the prompt state
    // THEN the prompt is not done yet
    expect(await isRatePromptDone()).toBe(false);
  });

  it.each([1, 'true', null])(
    'reads an invalid stored state of %s as not done',
    async (stored) => {
      // GIVEN an invalid value in storage
      await seedStorage({ ratePromptDone: stored }, 'local');
      // WHEN the popup reads the prompt state
      // THEN only a real `true` counts as done
      expect(await isRatePromptDone()).toBe(false);
    },
  );

  it('remembers the prompt as done, in local storage only', async () => {
    // GIVEN a fresh install
    // WHEN the user rates or dismisses the prompt
    await markRatePromptDone();
    // THEN it is done from now on, and Chrome Sync never gets a copy
    expect(await isRatePromptDone()).toBe(true);
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });
});

describe('rating ask storage', () => {
  it('reads a fresh install as a first ask at 50, writing nothing', async () => {
    // GIVEN a fresh install
    // WHEN the popup reads the ask state
    const ask = await getRateAsk();
    // THEN the first ask is at 50, asks are on, and nothing is stored
    expect(ask).toEqual({ nextAskAt: RATE_FIRST_ASK_AT, neverAsk: false });
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
    expect(chrome.storage.local.remove).not.toHaveBeenCalled();
  });

  it('saves a postponed ask and "don\'t ask again" in local storage only', async () => {
    // GIVEN a fresh install
    // WHEN the user closes the prompt at 173 skips
    await postponeRateAsk(173);
    // THEN it is due again 100 skips later
    expect(await getRateAsk()).toEqual({
      nextAskAt: 173 + RATE_ASK_EVERY,
      neverAsk: false,
    });
    // WHEN the user says "Don't ask again"
    await stopRateAsk();
    // THEN it is never asked again, and Chrome Sync never gets a copy
    expect((await getRateAsk()).neverAsk).toBe(true);
    expect(chrome.storage.sync.set).not.toHaveBeenCalled();
  });

  it('moves a handled 1.2.0 prompt to ask again 100 skips later', async () => {
    // GIVEN a 1.2.0 install whose user closed or rated the prompt, at 70 skips
    await seedStorage({ skipCount: 70, ratePromptDone: true }, 'local');
    // WHEN the popup reads the ask state
    const ask = await getRateAsk();
    // THEN the next ask is 100 skips away, kept for later popups, and the old
    // state is gone
    expect(ask.nextAskAt).toBe(70 + RATE_ASK_EVERY);
    expect(
      await chrome.storage.local.get([
        'skipCount',
        'rateNextAskAt',
        'ratePromptDone',
      ]),
    ).toEqual({
      skipCount: 70,
      rateNextAskAt: 70 + RATE_ASK_EVERY,
    });
  });
});
