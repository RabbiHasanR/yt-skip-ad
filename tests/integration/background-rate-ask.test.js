import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RATE_BADGE_TEXT,
  RATE_FIRST_ASK_AT,
} from '../../src/shared/constants.js';
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

/**
 * Makes `chrome.windows.getLastFocused` report one window, as Chrome would.
 *
 * @param {{ state: string, focused: boolean }} window The window's state.
 */
function lastFocusedWindow(window) {
  /** @type {import('vitest').Mock} */ (
    chrome.windows.getLastFocused
  ).mockResolvedValue({ id: 1, ...window });
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

  it('never opens the popup once the prompt is answered', async () => {
    // GIVEN the user answered the prompt at 49 skips, and the worker is running
    await seedStorage(
      { skipCount: RATE_FIRST_ASK_AT - 1, ratePromptDone: true },
      'local',
    );
    await startWorker();
    // WHEN skipping goes on past 50 and 150
    for (let count = RATE_FIRST_ASK_AT; count <= 150; count += 1) {
      await skipTo(count);
    }
    // THEN the popup never opens by itself
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(chrome.action.openPopup).not.toHaveBeenCalled();
  });

  it.each(
    /** @type {{ change: string, before: Record<string, unknown>, after: Record<string, unknown> }[]} */ ([
      {
        change: 'a skip between milestones',
        before: { skipCount: RATE_FIRST_ASK_AT },
        after: { skipCount: RATE_FIRST_ASK_AT + 1 },
      },
      {
        change: 'a counter reset',
        before: { skipCount: 120 },
        after: { skipCount: 0 },
      },
      {
        change: 'a settings save',
        before: { skipCount: RATE_FIRST_ASK_AT - 1 },
        after: { enabled: false },
      },
    ]),
  )("doesn't open the popup for $change", async ({ before, after }) => {
    // GIVEN the prompt unanswered, and the worker running
    await seedStorage(before, 'local');
    await startWorker();
    // WHEN storage changes without crossing a milestone
    await chrome.storage.local.set(after);
    // THEN the popup doesn't open
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(chrome.action.openPopup).not.toHaveBeenCalled();
  });

  it('shows a badge instead of opening the popup in a fullscreen window', async () => {
    // GIVEN 49 ads skipped, the prompt unanswered, and a fullscreen video
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT - 1 }, 'local');
    lastFocusedWindow({ state: 'fullscreen', focused: true });
    await startWorker();
    // WHEN a YouTube tab skips the 50th ad
    await skipTo(RATE_FIRST_ASK_AT);
    // THEN the popup stays closed, and a ★ badge on the icon waits instead
    await vi.waitFor(() =>
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
        text: RATE_BADGE_TEXT,
      }),
    );
    expect(chrome.action.openPopup).not.toHaveBeenCalled();
  });

  it("shows a badge when Chrome isn't the focused app", async () => {
    // GIVEN 49 ads skipped, and another app in front of Chrome
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT - 1 }, 'local');
    lastFocusedWindow({ state: 'maximized', focused: false });
    await startWorker();
    // WHEN a background YouTube tab skips the 50th ad
    await skipTo(RATE_FIRST_ASK_AT);
    // THEN Chrome isn't pulled to the front; a ★ badge waits on the icon
    await vi.waitFor(() =>
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
        text: RATE_BADGE_TEXT,
      }),
    );
    expect(chrome.action.openPopup).not.toHaveBeenCalled();
  });

  it('shows a badge when Chrome refuses to open the popup', async () => {
    // GIVEN 49 ads skipped, and a window Chrome still won't open the popup in
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT - 1 }, 'local');
    /** @type {import('vitest').Mock} */ (
      chrome.action.openPopup
    ).mockRejectedValue(new Error('Could not find an active browser window.'));
    await startWorker();
    // WHEN a YouTube tab skips the 50th ad
    await skipTo(RATE_FIRST_ASK_AT);
    // THEN a ★ badge waits on the icon instead
    await vi.waitFor(() =>
      expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
        text: RATE_BADGE_TEXT,
      }),
    );
  });

  it('never shows the badge once the prompt is answered', async () => {
    // GIVEN the prompt answered at 49 skips, and a fullscreen video
    await seedStorage(
      { skipCount: RATE_FIRST_ASK_AT - 1, ratePromptDone: true },
      'local',
    );
    lastFocusedWindow({ state: 'fullscreen', focused: true });
    await startWorker();
    // WHEN a YouTube tab skips the 50th ad
    await skipTo(RATE_FIRST_ASK_AT);
    // THEN no badge appears, and the popup stays closed
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(chrome.action.setBadgeText).not.toHaveBeenCalled();
    expect(chrome.action.openPopup).not.toHaveBeenCalled();
  });
});
