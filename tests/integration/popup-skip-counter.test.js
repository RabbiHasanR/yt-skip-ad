import { beforeEach, describe, expect, it, vi } from 'vitest';
import { followPlayer } from '../../src/content/follow-player.js';
import { CHECK_THROTTLE_MS } from '../../src/shared/constants.js';
import { watchSettings } from '../../src/shared/storage.js';
import { loadPlayer } from '../fixtures/player.js';
import { openPopup } from '../fixtures/popup.js';
import { seedStorage } from '../setup/storage.js';

describe('popup skip counter', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows the skip counter increased by 1 after the content script clicks Skip', async () => {
    // GIVEN 4 ads were already skipped on this computer
    await seedStorage({ skipCount: 4 }, 'local');
    // WHEN the content script skips one more ad
    vi.useFakeTimers();
    const { startAd, showSkipButton, clicks } = loadPlayer();
    const stop = followPlayer(document, await watchSettings());
    startAd();
    showSkipButton();
    await vi.advanceTimersByTimeAsync(CHECK_THROTTLE_MS);
    stop();
    vi.useRealTimers();
    expect(clicks).toHaveBeenCalledOnce();
    // THEN the popup shows 5 ads skipped
    const { count } = await openPopup();
    await vi.waitFor(() => expect(count?.value).toBe('5'));
  });

  it('shows 0 ads skipped on a fresh install', async () => {
    // GIVEN a fresh install: nothing is stored yet
    // WHEN a colleague opens the popup
    const { count } = await openPopup();
    // THEN it shows 0 ads skipped
    await vi.waitFor(() => expect(count?.value).toBe('0'));
  });

  it('labels the skip counter and the Reset counter button', async () => {
    // GIVEN a colleague opens the popup
    const { count, reset } = await openPopup();
    // WHEN they look for the counter and its button
    // THEN the count has a visible label, and the button is named and never
    // submits the settings form
    expect(count?.labels[0]?.textContent?.trim()).toBe('Ads skipped:');
    expect(reset?.type).toBe('button');
  });

  it('updates the count while the popup is open', async () => {
    // GIVEN 2 ads were skipped, and the popup is open showing them
    await seedStorage({ skipCount: 2 }, 'local');
    const { count } = await openPopup();
    await vi.waitFor(() => expect(count?.value).toBe('2'));
    // WHEN a YouTube tab skips another ad
    await chrome.storage.local.set({ skipCount: 3 });
    // THEN the open popup shows the new count
    await vi.waitFor(() => expect(count?.value).toBe('3'));
  });

  it('keeps showing the count when a setting is saved', async () => {
    // GIVEN 7 ads were skipped, and the popup is open showing them
    await seedStorage({ skipCount: 7 }, 'local');
    const { count, delay } = await openPopup();
    await vi.waitFor(() => expect(count?.value).toBe('7'));
    // WHEN a colleague changes the delay
    delay.value = '3';
    delay.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(async () =>
      expect((await chrome.storage.local.get({ delaySec: 0 })).delaySec).toBe(
        3,
      ),
    );
    // THEN the counter still shows 7
    expect(count?.value).toBe('7');
  });

  it('shows a large count with digit grouping', async () => {
    // GIVEN 12345 ads were skipped
    await seedStorage({ skipCount: 12345 }, 'local');
    // WHEN a colleague opens the popup
    const { count } = await openPopup();
    // THEN the count is grouped the way their language writes numbers
    await vi.waitFor(() => expect(count?.value).toBe((12345).toLocaleString()));
  });

  it('resets the counter to 0 at once when Reset counter is clicked', async () => {
    // GIVEN 9 ads were skipped, and the popup is open showing them
    await seedStorage({ skipCount: 9 }, 'local');
    const { count, reset } = await openPopup();
    await vi.waitFor(() => expect(count?.value).toBe('9'));
    // WHEN a colleague clicks Reset counter, with no confirmation asked
    reset?.click();
    // THEN 0 is stored, and the popup shows 0
    await vi.waitFor(async () =>
      expect(await chrome.storage.local.get({ skipCount: null })).toEqual({
        skipCount: 0,
      }),
    );
    expect(count?.value).toBe('0');
  });
});
