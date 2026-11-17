import { describe, expect, it } from 'vitest';
import { loadFixture } from '../fixtures/load-fixture.js';

describe('test setup', () => {
  it('runs in a jsdom environment with a document', () => {
    // GIVEN the Vitest jsdom environment
    // WHEN a test creates a DOM element
    const element = document.createElement('div');
    // THEN it behaves like a browser element
    expect(element.tagName).toBe('DIV');
  });

  it('chrome.runtime.getURL returns an extension URL', () => {
    // GIVEN the chrome mock from tests/setup/
    // WHEN a module resolves a packaged file
    const url = chrome.runtime.getURL('src/content/main.js');
    // THEN it gets an extension URL for that path
    expect(url).toBe('chrome-extension://test-id/src/content/main.js');
  });

  it('loads the player fixture with a Skip button inside the player', () => {
    // GIVEN the YouTube-like player fixture
    // WHEN a test loads it into the document
    loadFixture('player.html');
    // THEN the player holds a Skip button, hidden as in the countdown
    const player = document.querySelector('#movie_player');
    expect(player?.classList.contains('html5-video-player')).toBe(true);
    const button = player?.querySelector('.ytp-skip-ad-button');
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button?.closest('[style*="display: none"]')).not.toBeNull();
  });

  // Runs in file order: the first test leaves a call, the second checks it's gone.
  describe('chrome mock calls are reset between tests', () => {
    it('records a call', () => {
      // GIVEN a fresh chrome mock
      // WHEN a test calls it
      chrome.runtime.getURL('a.js');
      // THEN the call is recorded
      expect(chrome.runtime.getURL).toHaveBeenCalledTimes(1);
    });

    it('starts the next test with no recorded calls', () => {
      // GIVEN the previous test called the mock
      // WHEN this test starts
      // THEN no calls are recorded
      expect(chrome.runtime.getURL).not.toHaveBeenCalled();
    });
  });
});
