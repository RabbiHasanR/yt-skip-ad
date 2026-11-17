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
});
