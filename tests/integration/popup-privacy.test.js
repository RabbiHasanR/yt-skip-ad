import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_REVIEWS_URL } from '../../src/shared/constants.js';
import { openPopup } from '../fixtures/popup.js';

/** @returns {string} The source repo, as `manifest.json` names it. */
function homepage() {
  return JSON.parse(readFileSync('manifest.json', 'utf8')).homepage_url;
}

/**
 * Finds a footer link by its text, leaving out decorative `aria-hidden`
 * parts such as the star after Source.
 *
 * @param {string} text The link text.
 * @returns {HTMLAnchorElement | undefined} The link, if there is one.
 */
function linkNamed(text) {
  return [
    ...(document.querySelector('footer')?.querySelectorAll('a') ?? []),
  ].find((link) => {
    const copy = /** @type {HTMLAnchorElement} */ (link.cloneNode(true));
    copy.querySelectorAll('[aria-hidden="true"]').forEach((el) => el.remove());
    return copy.textContent?.trim() === text;
  });
}

describe('popup privacy line', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('says no data is collected and links to the privacy policy and the source', async () => {
    // GIVEN a user opens the popup
    await openPopup();
    // WHEN they read its footer
    const footer = document.querySelector('footer');
    // THEN it says no data is collected, with links to the privacy policy and
    // the source code, both under the homepage the manifest names
    expect(footer?.textContent).toContain('No data collected');
    expect(linkNamed('Privacy')?.href).toBe(
      `${homepage()}/blob/main/PRIVACY.md`,
    );
    expect(linkNamed('Source')?.href).toBe(homepage());
  });

  it('links to the store reviews, so users can rate it', async () => {
    // GIVEN a user opens the popup
    await openPopup();
    // WHEN they read its footer
    // THEN a Rate link goes to the extension's reviews on the Chrome Web Store
    expect(linkNamed('Rate')?.href).toBe(STORE_REVIEWS_URL);
  });

  it('invites a GitHub star on the Source link, keeping its name', async () => {
    // GIVEN a user opens the popup
    await openPopup();
    // WHEN they look at the Source link
    const source = linkNamed('Source');
    // THEN it still goes to the source, with a decorative star screen readers
    // skip, and a tooltip inviting a star
    expect(source?.href).toBe(homepage());
    expect(source?.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      '★',
    );
    expect(source?.title).toMatch(/star/i);
  });

  it.each(['Privacy', 'Source', 'Rate'])(
    'opens the %s link in a new tab, without giving it the popup',
    async (text) => {
      // GIVEN the popup is open
      await openPopup();
      // WHEN the user follows the link
      const link = linkNamed(text);
      // THEN it opens in a new tab, and the page gets no handle to the popup
      expect(link?.target).toBe('_blank');
      expect(link?.relList.contains('noopener')).toBe(true);
    },
  );
});
