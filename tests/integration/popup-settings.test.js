import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { seedStorage } from '../setup/storage.js';

const POPUP = '../../popup/popup.js';

/**
 * Opens the popup as Chrome does: its HTML, then its module script.
 *
 * @returns {Promise<{ enabled: HTMLInputElement, delay: HTMLInputElement }>}
 *   The auto-skip checkbox and the delay field.
 */
async function openPopup() {
  document.documentElement.innerHTML = readFileSync('popup/popup.html', 'utf8');
  await import(POPUP);
  return {
    enabled: /** @type {HTMLInputElement} */ (
      document.querySelector('input[type="checkbox"]')
    ),
    delay: /** @type {HTMLInputElement} */ (
      document.querySelector('input[type="number"]')
    ),
  };
}

/**
 * Reads both settings as they are stored now.
 *
 * @returns {Promise<Record<string, unknown>>} The stored settings.
 */
function readStored() {
  return chrome.storage.sync.get({ enabled: true, delaySec: 0 });
}

/**
 * Changes a control the way a colleague does, firing its `change` event.
 *
 * @param {HTMLInputElement} input The control.
 * @param {(input: HTMLInputElement) => void} edit Sets the new value.
 */
function change(input, edit) {
  edit(input);
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('popup settings', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('shows the stored settings when the popup opens', async () => {
    // GIVEN a colleague turned auto-skip off and set a 4-second delay
    await seedStorage({ enabled: false, delaySec: 4 });
    // WHEN they open the popup
    const { enabled, delay } = await openPopup();
    // THEN the controls show those settings
    expect(enabled.checked).toBe(false);
    expect(delay.value).toBe('4');
  });

  it.each([
    { label: 'Auto-skip ads', control: 'enabled' },
    { label: 'Delay (seconds)', control: 'delay' },
  ])('labels the $label control', async ({ label, control }) => {
    // GIVEN a colleague opens the popup
    const controls = await openPopup();
    // WHEN they look for the control
    const input = controls[/** @type {'enabled' | 'delay'} */ (control)];
    // THEN it has a visible label naming it
    expect(input.labels?.[0]?.textContent?.trim()).toBe(label);
  });

  it('shows auto-skip on with no delay on a fresh install', async () => {
    // GIVEN a fresh install: nothing is stored yet
    // WHEN a colleague opens the popup
    const { enabled, delay } = await openPopup();
    // THEN auto-skip is on with no delay
    expect(enabled.checked).toBe(true);
    expect(delay.value).toBe('0');
  });

  it('saves auto-skip as soon as the checkbox is unticked, keeping the delay', async () => {
    // GIVEN a stored 4-second delay, and the popup is open
    await seedStorage({ delaySec: 4 });
    const { enabled } = await openPopup();
    // WHEN a colleague unticks "Auto-skip ads"
    change(enabled, (input) => {
      input.checked = false;
    });
    // THEN auto-skip is saved as off, and the delay is untouched
    await vi.waitFor(async () =>
      expect(await readStored()).toEqual({ enabled: false, delaySec: 4 }),
    );
  });

  it('saves a new delay when the field changes', async () => {
    // GIVEN auto-skip is stored off, and the popup is open
    await seedStorage({ enabled: false });
    const { delay } = await openPopup();
    // WHEN a colleague sets the delay to 3
    change(delay, (input) => {
      input.value = '3';
    });
    // THEN the delay is saved, and auto-skip stays off
    await vi.waitFor(async () =>
      expect(await readStored()).toEqual({ enabled: false, delaySec: 3 }),
    );
  });
});
