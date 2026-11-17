import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';

describe('popup placeholder', () => {
  beforeEach(() => {
    // GIVEN the popup page as Chrome would open it
    document.documentElement.innerHTML = readFileSync(
      'popup/popup.html',
      'utf8',
    );
  });

  it('popup shows the extension name and a placeholder line', () => {
    // WHEN a colleague opens the popup
    const heading = document.querySelector('h1');
    const message = document.querySelector('p');
    // THEN they see the name and a short placeholder message
    expect(heading?.textContent).toBe('YT Skip Ad');
    expect(message?.textContent).toBe(
      'Coming soon: settings for skipping ads.',
    );
  });
});
