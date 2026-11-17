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
});
