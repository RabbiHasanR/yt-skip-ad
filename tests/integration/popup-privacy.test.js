import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openPopup } from '../fixtures/popup.js';

/** @returns {string} The source repo, as `manifest.json` names it. */
function homepage() {
  return JSON.parse(readFileSync('manifest.json', 'utf8')).homepage_url;
}

/**
 * Finds a popup link by its visible text.
 *
 * @param {string} text The link text.
 * @returns {HTMLAnchorElement | undefined} The link, if there is one.
 */
function linkNamed(text) {
  return [...document.querySelectorAll('a')].find(
    (link) => link.textContent?.trim() === text,
  );
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

  it.each(['Privacy', 'Source'])(
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
