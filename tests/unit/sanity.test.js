import { describe, expect, it } from 'vitest';

describe('test setup', () => {
  it('runs in a jsdom environment with a document', () => {
    // GIVEN the Vitest jsdom environment
    // WHEN a test creates a DOM element
    const element = document.createElement('div');
    // THEN it behaves like a browser element
    expect(element.tagName).toBe('DIV');
  });
});
