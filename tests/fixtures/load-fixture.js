import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Replaces the jsdom document's body with the body of a fixture file.
 *
 * @param {string} name File name inside `tests/fixtures/`, e.g. `player.html`.
 */
export function loadFixture(name) {
  const html = readFileSync(
    fileURLToPath(new URL(name, import.meta.url)),
    'utf8',
  );
  const fixture = new DOMParser().parseFromString(html, 'text/html');
  document.body.replaceWith(document.importNode(fixture.body, true));
}
