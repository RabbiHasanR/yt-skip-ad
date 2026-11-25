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

/** @returns {Promise<unknown>} The stored prompt state. */
async function storedDone() {
  return (await chrome.storage.local.get({ ratePromptDone: null }))
    .ratePromptDone;
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

  it('appears while the popup is open, once the threshold is reached', async () => {
    // GIVEN one ad short of the threshold, and the popup open
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT - 1 }, 'local');
    await openPopup();
    // WHEN a YouTube tab skips one more ad
    await chrome.storage.local.set({ skipCount: RATE_FIRST_ASK_AT });
    // THEN the prompt appears
    await vi.waitFor(() => expect(ratePrompt()?.hidden).toBe(false));
  });

  it.each(['Rate it ★', 'Dismiss'])(
    'hides for good after the user clicks %s',
    async (name) => {
      // GIVEN the prompt is showing
      await seedStorage({ skipCount: RATE_FIRST_ASK_AT }, 'local');
      await openPopup();
      // WHEN the user clicks the control
      promptControl(name)?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );
      // THEN it hides now, is remembered, and stays hidden as the count grows
      expect(ratePrompt()?.hidden).toBe(true);
      await vi.waitFor(async () => expect(await storedDone()).toBe(true));
      await chrome.storage.local.set({ skipCount: RATE_FIRST_ASK_AT + 1 });
      await vi.waitFor(async () =>
        expect(document.querySelector('output')?.value).toBe(
          String(RATE_FIRST_ASK_AT + 1),
        ),
      );
      expect(ratePrompt()?.hidden).toBe(true);
    },
  );

  it('never comes back in a later popup once handled', async () => {
    // GIVEN the user dismissed the prompt earlier
    await seedStorage(
      { skipCount: RATE_FIRST_ASK_AT * 2, ratePromptDone: true },
      'local',
    );
    // WHEN they open the popup again
    await openPopup();
    // THEN no rating is asked for
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

  it('asks for a rating at the threshold, naming it', async () => {
    // GIVEN the threshold of ads skipped
    await seedStorage({ skipCount: RATE_FIRST_ASK_AT }, 'local');
    // WHEN the user opens the popup
    await openPopup();
    // THEN it asks for a rating, links to the store reviews in a new tab,
    // and says how many ads were skipped
    expect(ratePrompt()?.hidden).toBe(false);
    expect(ratePrompt()?.textContent).toContain(`${RATE_FIRST_ASK_AT}+`);
    const link = /** @type {HTMLAnchorElement} */ (promptControl('Rate it ★'));
    expect(link.href).toBe(STORE_REVIEWS_URL);
    expect(link.target).toBe('_blank');
    expect(link.relList.contains('noopener')).toBe(true);
  });

  it.fails(
    'asks again 100 skips after the user closes the prompt',
    async () => {
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
    },
  );
});
