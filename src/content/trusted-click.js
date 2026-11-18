// Runs in YouTube's own JavaScript world ("world": "MAIN"), before YouTube's
// scripts ("run_at": "document_start"). A classic script: no imports and no
// chrome.* APIs, which don't exist in the page's world.
//
// YouTube's Skip handler ignores clicks whose `event.isTrusted` is false, and
// every click made by a script is untrusted. So click listeners added to a
// Skip button are wrapped: they receive the real event with `isTrusted` read
// as true. The extension still clicks with `.click()`; nothing else changes.
(() => {
  // Same list as SKIP_BUTTON_SELECTORS in src/core/selectors.js, which this
  // script can't import; tests fail if the two drift apart.
  const SKIP_BUTTON = [
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-skip-button',
  ].join(', ');

  const { addEventListener, removeEventListener } = EventTarget.prototype;

  /**
   * One wrapper per listener, so adding the same listener twice still adds
   * it once, and removing the listener can find its wrapper.
   *
   * @type {WeakMap<EventListener, EventListener>}
   */
  const wrappers = new WeakMap();

  /**
   * Makes an event that reads as trusted and is otherwise the real event.
   * Its methods are bound to the real event, because native methods such as
   * `preventDefault` throw when called on anything else.
   *
   * @param {Event} event The real event.
   * @returns {Event} A view of it whose `isTrusted` is true.
   */
  function trusted(event) {
    return new Proxy(event, {
      get(target, prop) {
        if (prop === 'isTrusted') return true;
        const value = Reflect.get(target, prop);
        return typeof value === 'function' && prop !== 'constructor'
          ? value.bind(target)
          : value;
      },
    });
  }

  /**
   * Tells whether a listener should see trusted clicks.
   *
   * @param {EventTarget} target Where the listener is added.
   * @param {string} type The event type.
   * @param {unknown} listener The listener.
   * @returns {listener is EventListener} True for a click listener function
   *   on a Skip button.
   */
  function isSkipClickListener(target, type, listener) {
    return (
      type === 'click' &&
      typeof listener === 'function' &&
      target instanceof Element &&
      target.matches(SKIP_BUTTON)
    );
  }

  /**
   * Gets the wrapper that passes trusted clicks to a listener.
   *
   * @param {EventListener} listener YouTube's listener.
   * @returns {EventListener} The wrapper to add in its place.
   */
  function wrapperFor(listener) {
    let wrapper = wrappers.get(listener);
    if (!wrapper) {
      /**
       * @this {EventTarget}
       * @param {Event} event The real click.
       */
      wrapper = function (event) {
        listener.call(this, trusted(event));
      };
      wrappers.set(listener, wrapper);
    }
    return wrapper;
  }

  /**
   * `addEventListener`, except that a Skip button's click listener is
   * wrapped to see trusted clicks.
   *
   * @this {EventTarget}
   * @param {string} type The event type.
   * @param {EventListenerOrEventListenerObject | null} listener The listener.
   * @param {boolean | AddEventListenerOptions} [options] Listener options.
   */
  function addTrustingEventListener(type, listener, options) {
    const added = isSkipClickListener(this, type, listener)
      ? wrapperFor(listener)
      : listener;
    addEventListener.call(this, type, added, options);
  }

  /**
   * `removeEventListener`, except that it also removes the listener's
   * wrapper. Removing a listener that isn't there does nothing, so both are
   * removed whether or not the listener was wrapped when it was added.
   *
   * @this {EventTarget}
   * @param {string} type The event type.
   * @param {EventListenerOrEventListenerObject | null} listener The listener.
   * @param {boolean | EventListenerOptions} [options] Listener options.
   */
  function removeTrustingEventListener(type, listener, options) {
    removeEventListener.call(this, type, listener, options);
    const wrapper = typeof listener === 'function' && wrappers.get(listener);
    if (wrapper) removeEventListener.call(this, type, wrapper, options);
  }

  EventTarget.prototype.addEventListener = addTrustingEventListener;
  EventTarget.prototype.removeEventListener = removeTrustingEventListener;
})();
