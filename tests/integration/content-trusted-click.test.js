import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SKIP_BUTTON_SELECTORS } from '../../src/core/selectors.js';

const TRUSTED_CLICK = '../../src/content/trusted-click.js';
const { addEventListener, removeEventListener } = EventTarget.prototype;

/**
 * Adds a button to the page, the way YouTube adds its Skip button.
 *
 * @param {string} className The button's classes.
 * @returns {HTMLButtonElement} The new button.
 */
function addButton(className) {
  const button = document.createElement('button');
  button.className = className;
  document.body.append(button);
  return button;
}

/**
 * Records the `isTrusted` value of every event a listener receives.
 *
 * @returns {{ listener: (event: Event) => void, seen: boolean[] }} The
 *   listener, and the values it saw, in order.
 */
function recordTrust() {
  /** @type {boolean[]} */
  const seen = [];
  return { listener: (event) => seen.push(event.isTrusted), seen };
}

describe('trusted-click script', () => {
  beforeEach(async () => {
    // GIVEN Chrome has run the script in the page's world, as on YouTube
    vi.resetModules();
    await import(TRUSTED_CLICK);
  });

  afterEach(() => {
    Object.assign(EventTarget.prototype, {
      addEventListener,
      removeEventListener,
    });
    document.body.replaceChildren();
  });

  it.each(SKIP_BUTTON_SELECTORS)(
    'a click listener on a %s Skip button sees a trusted click',
    (selector) => {
      // GIVEN YouTube adds a Skip button and its click listener
      const button = addButton(`${selector.slice(1)} ytp-button`);
      const { listener, seen } = recordTrust();
      button.addEventListener('click', listener);
      // WHEN the extension clicks it from a script
      button.click();
      // THEN YouTube's listener sees a trusted click
      expect(seen).toEqual([true]);
    },
  );

  it('the trusted click still acts as the real event', () => {
    // GIVEN YouTube's Skip listener inspects and cancels the click
    const button = addButton('ytp-skip-ad-button');
    /** @type {{ isMouseEvent: boolean, target: unknown, self: unknown }[]} */
    const seen = [];
    button.addEventListener('click', function (event) {
      event.preventDefault();
      seen.push({
        isMouseEvent: event instanceof MouseEvent,
        target: event.currentTarget,
        self: this,
      });
    });
    // WHEN the extension clicks it from a script
    const click = new MouseEvent('click', { cancelable: true });
    button.dispatchEvent(click);
    // THEN the listener saw a real mouse click on the button, and cancelled it
    expect(seen).toEqual([
      { isMouseEvent: true, target: button, self: button },
    ]);
    expect(click.defaultPrevented).toBe(true);
  });

  it.each([
    ['a click listener on another button', 'ytp-button', 'click', false],
    [
      'a mousedown listener on a Skip button',
      'ytp-skip-ad-button',
      'mousedown',
      false,
    ],
    ['a listener object on a Skip button', 'ytp-skip-ad-button', 'click', true],
  ])('leaves %s untouched', (_, className, type, asObject) => {
    // GIVEN YouTube adds a listener the extension has no reason to change
    const button = addButton(className);
    /** @type {Event[]} */
    const received = [];
    /** @param {Event} event */
    const handle = (event) => received.push(event);
    button.addEventListener(type, asObject ? { handleEvent: handle } : handle);
    // WHEN that event is dispatched from a script
    const event = new MouseEvent(type);
    button.dispatchEvent(event);
    // THEN the listener gets the real, untrusted event itself
    expect(received).toHaveLength(1);
    expect(received[0]).toBe(event);
    expect(received[0].isTrusted).toBe(false);
  });

  it.each([
    ['without options', undefined],
    ['in the capture phase', { capture: true }],
  ])(
    "removing a Skip button's click listener still stops it (%s)",
    (_, options) => {
      // GIVEN YouTube's Skip listener was added, then removed again
      const button = addButton('ytp-skip-ad-button');
      const { listener, seen } = recordTrust();
      button.addEventListener('click', listener, options);
      button.removeEventListener('click', listener, options);
      // WHEN the extension clicks the button
      button.click();
      // THEN the removed listener does not run
      expect(seen).toEqual([]);
    },
  );
});
