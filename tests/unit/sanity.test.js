import { describe, expect, it } from 'vitest';

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
