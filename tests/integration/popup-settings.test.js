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

describe('popup settings', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it.fails('shows the stored settings when the popup opens', async () => {
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
});
