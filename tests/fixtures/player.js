// Drives tests/fixtures/player.html the way YouTube drives its player. Uses
// YouTube's literal class names rather than src/core/selectors.js, so a typo
// in a selector fails a test instead of agreeing with itself.
import { vi } from 'vitest';
import { loadFixture } from './load-fixture.js';

/**
 * Loads the player fixture into the document, with a click counter on its
 * Skip button. The ad is not showing and the button is hidden (countdown).
 *
 * @returns {{
 *   player: HTMLElement,
 *   button: HTMLButtonElement,
 *   clicks: import('vitest').Mock,
 *   startAd: () => void,
 *   endAd: () => void,
 *   showSkipButton: () => void,
 *   hideSkipButton: () => void,
 * }} The player, its Skip button, the click counter, and YouTube-like actions.
 */
export function loadPlayer() {
  loadFixture('player.html');
  const player = /** @type {HTMLElement} */ (
    document.querySelector('#movie_player')
  );
  const button = /** @type {HTMLButtonElement} */ (
    player.querySelector('.ytp-skip-ad-button')
  );
  const slot = /** @type {HTMLElement} */ (button.parentElement);
  const clicks = vi.fn();
  button.addEventListener('click', clicks);
  return {
    player,
    button,
    clicks,
    startAd: () => player.classList.add('ad-showing'),
    endAd: () => player.classList.remove('ad-showing'),
    showSkipButton: () => {
      slot.style.display = '';
    },
    hideSkipButton: () => {
      slot.style.display = 'none';
    },
  };
}
