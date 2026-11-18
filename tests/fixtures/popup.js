// Opens the real popup in jsdom, as Chrome does: its HTML, then its module
// script. Controls are found by type, label text, or role, not by the IDs
// popup.js uses, so a renamed ID fails a test instead of agreeing with itself.
import { readFileSync } from 'node:fs';

const POPUP = '../../popup/popup.js';

/**
 * Loads `popup/popup.html` and runs `popup/popup.js`. Call
 * `vi.resetModules()` before each test so the script runs again.
 *
 * @returns {Promise<{
 *   enabled: HTMLInputElement,
 *   delay: HTMLInputElement,
 *   count: HTMLOutputElement | null,
 *   reset: HTMLButtonElement | undefined,
 * }>} The auto-skip checkbox, the delay field, the skip counter, and the
 *   Reset counter button.
 */
export async function openPopup() {
  document.documentElement.innerHTML = readFileSync('popup/popup.html', 'utf8');
  await import(POPUP);
  return {
    enabled: /** @type {HTMLInputElement} */ (
      document.querySelector('input[type="checkbox"]')
    ),
    delay: /** @type {HTMLInputElement} */ (
      document.querySelector('input[type="number"]')
    ),
    count: document.querySelector('output'),
    reset: [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Reset counter',
    ),
  };
}
