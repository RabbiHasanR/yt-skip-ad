import { expect, test } from './fixtures.js';

test("Chrome blocks a network request from the extension's popup", async ({
  context,
  extensionId,
}) => {
  // GIVEN the extension's popup, open in Chromium
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  // WHEN code in the popup tries to send a request off the device
  const blockedBy = await popup.evaluate(() => {
    const violation = new Promise((resolve) =>
      document.addEventListener(
        'securitypolicyviolation',
        (event) => resolve(event.effectiveDirective),
        { once: true },
      ),
    );
    fetch('https://example.com/').catch(() => {});
    return violation;
  });
  // THEN Chrome's policy stops it before it leaves: the request is refused by
  // connect-src, not merely aborted by the test's offline routing
  expect(blockedBy).toBe('connect-src');
});

test("Chrome blocks a network request from the extension's service worker", async ({
  context,
}) => {
  // GIVEN the extension's background service worker, running in Chromium
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker'));
  // WHEN code in the worker tries to send a request off the device
  const blockedBy = await worker.evaluate(() => {
    const violation = new Promise((resolve) =>
      self.addEventListener(
        'securitypolicyviolation',
        (event) => resolve(event.effectiveDirective),
        { once: true },
      ),
    );
    fetch('https://example.com/').catch(() => {});
    return violation;
  });
  // THEN Chrome's policy stops it before it leaves, as in the popup
  expect(blockedBy).toBe('connect-src');
});
