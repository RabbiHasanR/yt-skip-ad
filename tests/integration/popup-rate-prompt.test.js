import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RATE_ASK_EVERY,
  RATE_FIRST_ASK_AT,
  STORE_REVIEWS_URL,
} from '../../src/shared/constants.js';
import { openPopup } from '../fixtures/popup.js';
import { seedStorage } from '../setup/storage.js';

/** @returns {HTMLElement | null} The rating prompt, found by its name. */
function ratePrompt() {
  return document.querySelector('aside[aria-label="Rating request"]');
}

/**
 * Finds a control inside the rating prompt by its name.
 *
 * @param {string} name Visible text or `aria-label`.
 * @returns {HTMLElement | undefined} The link or button, if there is one.
 */
function promptControl(name) {
  return [
    .../** @type {NodeListOf<HTMLElement>} */ (
      ratePrompt()?.querySelectorAll('a, button') ?? []
    ),
  ].find(
    (el) =>
      el.getAttribute('aria-label') === name || el.textContent?.trim() === name,
  );
}

/**
 * Clicks a control inside the rating prompt.
 *
 * @param {string} name Visible text or `aria-label`.
 */
function clickPromptControl(name) {
  promptControl(name)?.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true }),
  );
}

/** @returns {Promise<unknown>} The stored answer to the prompt. */
async function storedDone() {
  return (await chrome.storage.local.get({ ratePromptDone: null }))
    .ratePromptDone;
}

/** @returns {Promise<unknown>} The stored skip count of the next ask. */
async function storedNextAsk() {
  return (await chrome.storage.local.get({ rateNextAskAt: null }))
    .rateNextAskAt;
}

/**
 * Closes the popup and opens it again once the skip counter is at a value.
 *
 * @param {number} skipCount Ads skipped by then.
 */
async function reopenPopupAt(skipCount) {
  await chrome.storage.local.set({ skipCount });
  vi.resetModules();
  await openPopup();
}

describe('popup rating prompt', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stays hidden below the threshold', async () => {
    // GIVEN fewer ads skipped than the threshold
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT - 1 }, 'local');
    // WHEN the user opens the popup
    await openPopup();
    // THEN no rating is asked for
    expect(ratePrompt()?.hidden).toBe(true);
  });

  it('appears while the popup is open, once the next ask is reached', async () => {
    // GIVEN one ad short of a next ask at 250, and the popup open
    await seedStorage({ skipCount: 249, rateNextAskAt: 250 }, 'local');
    await openPopup();
    expect(ratePrompt()?.hidden).toBe(true);
    // WHEN a YouTube tab skips one more ad
    await chrome.storage.local.set({ skipCount: 250 });
    // THEN the prompt appears, naming the new milestone
    await vi.waitFor(() => expect(ratePrompt()?.hidden).toBe(false));
    expect(ratePrompt()?.textContent).toContain('250+ ads skipped');
  });

  it('opens the reviews page and asks again 100 skips later after Rate it ★', async () => {
    // GIVEN the prompt is showing at 150 skips, and the popup is open
    await seedStorage({ skipCount: 150, rateNextAskAt: 150 }, 'local');
    const { count } = await openPopup();
    // WHEN the user clicks Rate it ★
    const opened = promptControl('Rate it ★')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    // THEN the link still opens, the prompt hides, and it asks again only
    // once 100 more ads are skipped
    expect(opened).toBe(true);
    expect(ratePrompt()?.hidden).toBe(true);
    await vi.waitFor(async () =>
      expect(await storedNextAsk()).toBe(150 + RATE_ASK_EVERY),
    );
    await chrome.storage.local.set({ skipCount: 150 + RATE_ASK_EVERY - 1 });
    await vi.waitFor(() =>
      expect(count?.value).toBe(String(150 + RATE_ASK_EVERY - 1)),
    );
    expect(ratePrompt()?.hidden).toBe(true);
    await chrome.storage.local.set({ skipCount: 150 + RATE_ASK_EVERY });
    await vi.waitFor(() => expect(ratePrompt()?.hidden).toBe(false));
  });

  it('never asks again after "Don\'t ask again", even after a counter reset', async () => {
    // GIVEN the prompt is showing, and the popup is open
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT }, 'local');
    const { count, reset } = await openPopup();
    // WHEN the user says "Don't ask again"
    clickPromptControl("Don't ask again");
    // THEN it hides now, is remembered, and never comes back: not at any
    // count, not after a reset, not in a later popup
    expect(ratePrompt()?.hidden).toBe(true);
    await vi.waitFor(async () =>
      expect(
        (await chrome.storage.local.get({ rateNeverAsk: null })).rateNeverAsk,
      ).toBe(true),
    );
    await chrome.storage.local.set({ skipCount: 5000 });
    await vi.waitFor(() => expect(count?.value).toBe((5000).toLocaleString()));
    expect(ratePrompt()?.hidden).toBe(true);
    reset?.click();
    await vi.waitFor(() => expect(count?.value).toBe('0'));
    await reopenPopupAt(RATE_FIRST_ASK_AT + RATE_ASK_EVERY);
    expect(ratePrompt()?.hidden).toBe(true);
  });

  it("doesn't come back early after the counter is reset", async () => {
    // GIVEN the next ask is at 220, and the popup is open at 120 skips
    await seedStorage({ skipCount: 120, rateNextAskAt: 220 }, 'local');
    const { count, reset } = await openPopup();
    // WHEN the user resets the counter, and it climbs past the first ask
    reset?.click();
    await vi.waitFor(() => expect(count?.value).toBe('0'));
    await chrome.storage.local.set({ skipCount: RATE_FIRST_ASK_AT + 10 });
    await vi.waitFor(() =>
      expect(count?.value).toBe(String(RATE_FIRST_ASK_AT + 10)),
    );
    // THEN no rating is asked for until the counter is back at 220
    expect(ratePrompt()?.hidden).toBe(true);
    expect(await storedNextAsk()).toBe(220);
  });

  it('asks for a rating once due, naming the count and offering three choices', async () => {
    // GIVEN 173 ads skipped, past a next ask at 150
    await seedStorage({ skipCount: 173, rateNextAskAt: 150 }, 'local');
    // WHEN the user opens the popup
    await openPopup();
    // THEN it asks for a rating, names the last milestone, links to the store
    // reviews in a new tab, and offers to close it or never ask again
    expect(ratePrompt()?.hidden).toBe(false);
    expect(ratePrompt()?.textContent).toContain('150+ ads skipped');
    const link = /** @type {HTMLAnchorElement} */ (promptControl('Rate it ★'));
    expect(link.href).toBe(STORE_REVIEWS_URL);
    expect(link.target).toBe('_blank');
    expect(link.relList.contains('noopener')).toBe(true);
    expect(promptControl('Dismiss')?.tagName).toBe('BUTTON');
    expect(promptControl("Don't ask again")?.tagName).toBe('BUTTON');
  });

  it('asks again 100 skips after the user closes the prompt', async () => {
    // GIVEN the prompt is showing at the first ask
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT }, 'local');
    await openPopup();
    // WHEN the user closes it
    clickPromptControl('Dismiss');
    // THEN it hides now, stays hidden in later popups until 100 more ads are
    // skipped, and then asks again
    expect(ratePrompt()?.hidden).toBe(true);
    const nextAsk = RATE_FIRST_ASK_AT + RATE_ASK_EVERY;
    await vi.waitFor(async () => expect(await storedNextAsk()).toBe(nextAsk));
    await reopenPopupAt(nextAsk - 1);
    expect(ratePrompt()?.hidden).toBe(true);
    await reopenPopupAt(nextAsk);
    expect(ratePrompt()?.hidden).toBe(false);
  });

  it.fails('never asks again after the user closes the prompt', async () => {
    // GIVEN the prompt is showing at 50 skips, and the popup is open
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT }, 'local');
    const { count } = await openPopup();
    // WHEN the user closes it
    clickPromptControl('Dismiss');
    // THEN it hides now, is remembered, and never comes back: not as the
    // count grows, not in a later popup
    expect(ratePrompt()?.hidden).toBe(true);
    await vi.waitFor(async () => expect(await storedDone()).toBe(true));
    await chrome.storage.local.set({ skipCount: 5000 });
    await vi.waitFor(() => expect(count?.value).toBe((5000).toLocaleString()));
    expect(ratePrompt()?.hidden).toBe(true);
    await reopenPopupAt(5000);
    expect(ratePrompt()?.hidden).toBe(true);
  });
});
