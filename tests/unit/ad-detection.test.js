import { describe, expect, it } from 'vitest';
import { findSkipButton } from '../../src/core/ad-detection.js';
import { loadPlayer } from '../fixtures/player.js';

describe('findSkipButton', () => {
  it.each([
    { selector: 'ytp-skip-ad-button' },
    { selector: 'ytp-ad-skip-button-modern' },
    { selector: 'ytp-ad-skip-button' },
  ])('finds a visible Skip button by its $selector class', ({ selector }) => {
    // GIVEN a visible Skip button that has only this class
    const { player, button, showSkipButton } = loadPlayer();
    button.className = selector;
    showSkipButton();
    // WHEN looking for the Skip button in the player
    const found = findSkipButton(player);
    // THEN that button is found
    expect(found).toBe(button);
  });

  it.each([
    {
      how: 'display none on its container',
      hide: (/** @type {HTMLElement} */ button) => {
        /** @type {HTMLElement} */ (button.parentElement).style.display =
          'none';
      },
    },
    {
      how: 'the hidden attribute on its container',
      hide: (/** @type {HTMLElement} */ button) => {
        /** @type {HTMLElement} */ (button.parentElement).hidden = true;
      },
    },
    {
      how: 'visibility hidden on its container',
      hide: (/** @type {HTMLElement} */ button) => {
        /** @type {HTMLElement} */ (button.parentElement).style.visibility =
          'hidden';
      },
    },
    {
      how: 'a stylesheet rule',
      hide: (/** @type {HTMLElement} */ button) => {
        const style = document.createElement('style');
        style.textContent = '.countdown { display: none; }';
        document.body.append(style);
        button.classList.add('countdown');
      },
    },
  ])('ignores a Skip button hidden by $how', ({ hide }) => {
    // GIVEN a Skip button in the player, hidden as during the countdown
    const { player, button, showSkipButton } = loadPlayer();
    showSkipButton();
    hide(button);
    // WHEN looking for the Skip button in the player
    const found = findSkipButton(player);
    // THEN no button is found
    expect(found).toBeNull();
  });
});
