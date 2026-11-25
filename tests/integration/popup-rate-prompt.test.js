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

  it('opens the reviews page and never asks again after Rate it ★', async () => {
    // GIVEN the prompt is showing at 50 skips, and the popup is open
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT }, 'local');
    await openPopup();
    // WHEN the user clicks Rate it ★
    const opened = promptControl('Rate it ★')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    // THEN the link still opens, the prompt hides, and it never comes back
    expect(opened).toBe(true);
    expect(ratePrompt()?.hidden).toBe(true);
    await vi.waitFor(async () => expect(await storedDone()).toBe(true));
    await reopenPopupAt(RATE_FIRST_ASK_AT + RATE_ASK_EVERY * 10);
    expect(ratePrompt()?.hidden).toBe(true);
  });

  it('asks for a rating once due, naming the count, with Rate it ★ and ×', async () => {
    // GIVEN 173 ads skipped, and the prompt never answered
    await seedStorage({ skipCount: 173 }, 'local');
    // WHEN the user opens the popup
    await openPopup();
    // THEN it asks for a rating, names the last milestone, links to the store
    // reviews in a new tab, and offers only those two answers
    expect(ratePrompt()?.hidden).toBe(false);
    expect(ratePrompt()?.textContent).toContain('150+ ads skipped');
    const link = /** @type {HTMLAnchorElement} */ (promptControl('Rate it ★'));
    expect(link.href).toBe(STORE_REVIEWS_URL);
    expect(link.target).toBe('_blank');
    expect(link.relList.contains('noopener')).toBe(true);
    expect(promptControl('Dismiss')?.tagName).toBe('BUTTON');
    expect(ratePrompt()?.querySelectorAll('a, button')).toHaveLength(2);
  });

  it('never asks again after the user closes the prompt', async () => {
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

  it('keeps a 1.2.0 answer: never asks again', async () => {
    // GIVEN a 1.2.0 install whose user answered the prompt, at 70 skips
    await seedStorage({ skipCount: 70, ratePromptDone: true }, 'local');
    // WHEN they open the updated popup
    await openPopup();
    // THEN no rating is asked for, and the answer is kept
    expect(ratePrompt()?.hidden).toBe(true);
    expect(await storedDone()).toBe(true);
  });

  it('stays gone after the counter is reset, once answered', async () => {
    // GIVEN the prompt was answered, and the popup is open at 50 skips
    await seedStorage(
      { skipCount: RATE_FIRST_ASK_AT, ratePromptDone: true },
      'local',
    );
    const { count, reset } = await openPopup();
    // WHEN the user resets the counter, and it climbs past 50 again
    reset?.click();
    await vi.waitFor(() => expect(count?.value).toBe('0'));
    await chrome.storage.local.set({ skipCount: RATE_FIRST_ASK_AT + 10 });
    await vi.waitFor(() =>
      expect(count?.value).toBe(String(RATE_FIRST_ASK_AT + 10)),
    );
    // THEN no rating is asked for, now or in a later popup
    expect(ratePrompt()?.hidden).toBe(true);
    expect(await storedDone()).toBe(true);
  });
});
