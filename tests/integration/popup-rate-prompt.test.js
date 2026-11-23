import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RATE_PROMPT_THRESHOLD,
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

describe('popup rating prompt', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stays hidden below the threshold', async () => {
    // GIVEN fewer ads skipped than the threshold
    await seedStorage({ skipCount: RATE_PROMPT_THRESHOLD - 1 }, 'local');
    // WHEN the user opens the popup
    await openPopup();
    // THEN no rating is asked for
    expect(ratePrompt()?.hidden).toBe(true);
  });

  it.fails('asks for a rating at the threshold, naming it', async () => {
    // GIVEN the threshold of ads skipped
    await seedStorage({ skipCount: RATE_PROMPT_THRESHOLD }, 'local');
    // WHEN the user opens the popup
    await openPopup();
    // THEN it asks for a rating, links to the store reviews in a new tab,
    // and says how many ads were skipped
    expect(ratePrompt()?.hidden).toBe(false);
    expect(ratePrompt()?.textContent).toContain(`${RATE_PROMPT_THRESHOLD}+`);
    const link = /** @type {HTMLAnchorElement} */ (promptControl('Rate it ★'));
    expect(link.href).toBe(STORE_REVIEWS_URL);
    expect(link.target).toBe('_blank');
    expect(link.relList.contains('noopener')).toBe(true);
  });
});
