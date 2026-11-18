import { describe, expect, it, vi } from 'vitest';
import { loadFixture } from '../fixtures/load-fixture.js';
import { seedStorage } from '../setup/storage.js';

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

  describe('chrome.storage mock', () => {
    it('the storage mock returns seeded values and the defaults for missing keys', async () => {
      // GIVEN a colleague saved only the delay
      await seedStorage({ delaySec: 3 });
      // WHEN code reads both settings with defaults
      const stored = await chrome.storage.sync.get({
        enabled: true,
        delaySec: 0,
      });
      // THEN the saved value wins and the missing key gets its default
      expect(stored).toEqual({ enabled: true, delaySec: 3 });
    });

    it("the storage mock tells listeners what changed, with the 'sync' area", async () => {
      // GIVEN a stored delay and a listener for storage changes
      await seedStorage({ delaySec: 3 });
      const listener = vi.fn();
      chrome.storage.onChanged.addListener(listener);
      // WHEN the delay changes and auto-skip is saved for the first time
      await chrome.storage.sync.set({ delaySec: 5, enabled: false });
      // THEN the listener hears each change once, as Chrome reports it
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        {
          delaySec: { oldValue: 3, newValue: 5 },
          enabled: { newValue: false },
        },
        'sync',
      );
    });
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
