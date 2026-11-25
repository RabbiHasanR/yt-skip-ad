import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RATE_FIRST_ASK_AT } from '../../src/shared/constants.js';
import { seedStorage } from '../setup/storage.js';

/**
 * Starts the background service worker, as Chrome does when it wakes it.
 *
 * @returns {Promise<void>} Resolves once its top-level code has run.
 */
async function startWorker() {
  vi.resetModules();
  await import('../../src/background/service-worker.js');
}

/**
 * Stores a new skip count, as a YouTube tab does after a skip.
 *
 * @param {number} skipCount Ads skipped now.
 * @returns {Promise<void>} Resolves once stored.
 */
async function skipTo(skipCount) {
  await chrome.storage.local.set({ skipCount });
}

describe('background rating auto-open', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('opens the popup when the 50th ad is skipped', async () => {
    // GIVEN 49 ads skipped, the prompt unanswered, and the worker running
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT - 1 }, 'local');
    await startWorker();
    // WHEN a YouTube tab skips the 50th ad
    await skipTo(RATE_FIRST_ASK_AT);
    // THEN the popup opens by itself, once
    await vi.waitFor(() =>
      expect(chrome.action.openPopup).toHaveBeenCalledTimes(1),
    );
  });

  it('opens the popup again at 150 and 250 while the prompt is unanswered', async () => {
    // GIVEN the popup opened at 50, but the user closed it without answering
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT }, 'local');
    await startWorker();
    // WHEN skipping goes on past 150 and 250
    for (let count = RATE_FIRST_ASK_AT + 1; count <= 250; count += 1) {
      await skipTo(count);
    }
    // THEN the popup opens by itself once at each of them
    await vi.waitFor(() =>
      expect(chrome.action.openPopup).toHaveBeenCalledTimes(2),
    );
  });
});
