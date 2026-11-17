import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPlayer } from '../fixtures/player.js';

const MAIN = '../../src/content/main.js';

describe('content script auto-skip', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('clicks a visible Skip button while an ad is showing', async () => {
    // GIVEN an ad is showing and its Skip button is visible
    const { startAd, showSkipButton, clicks } = loadPlayer();
    startAd();
    showSkipButton();
    // WHEN the content script loads on the page
    await import(MAIN);
    // THEN it clicks the Skip button once
    expect(clicks).toHaveBeenCalledOnce();
  });

  it('loads without errors on a page without a player', async () => {
    // GIVEN a page without a player, like the home page
    document.body.replaceChildren();
    // WHEN the content script loads on the page
    const load = import(MAIN);
    // THEN it loads without throwing
    await expect(load).resolves.toBeDefined();
  });
});
