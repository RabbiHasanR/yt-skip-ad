// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { PACKAGE_FILES, packageExtension } from '../../scripts/package.js';

const REPO_DIR = fileURLToPath(new URL('../../', import.meta.url));

/** @type {string[]} */
const tempDirs = [];

/** @returns {string} A new empty folder, removed after the test. */
function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'yt-skip-ad-'));
  tempDirs.push(dir);
  return dir;
}

/**
 * Lists a zip's file entries, as `unzip` sees them.
 *
 * @param {string} zipPath The zip to read.
 * @returns {string[]} Entry paths, folders left out.
 */
function zipEntries(zipPath) {
  return execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' })
    .split('\n')
    .filter((entry) => entry !== '' && !entry.endsWith('/'));
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('npm run package', () => {
  it.fails(
    'builds dist/yt-skip-ad-<version>.zip containing only the extension files',
    () => {
      // GIVEN the repo, with tests, specs, docs and node_modules beside the extension
      const outDir = makeTempDir();
      const { version } = JSON.parse(
        readFileSync(join(REPO_DIR, 'manifest.json'), 'utf8'),
      );
      // WHEN it is packaged
      const zipPath = packageExtension({ rootDir: REPO_DIR, outDir });
      // THEN the zip is named for the version and holds only the extension
      expect(basename(zipPath)).toBe(`yt-skip-ad-${version}.zip`);
      const entries = zipEntries(zipPath);
      expect(entries).toEqual(
        expect.arrayContaining([
          'manifest.json',
          'README.md',
          'src/content/loader.js',
          'popup/popup.html',
          'icons/icon16.png',
        ]),
      );
      const outside = entries.filter(
        (entry) =>
          !PACKAGE_FILES.some(
            (path) => entry === path || entry.startsWith(`${path}/`),
          ),
      );
      expect(outside).toEqual([]);
    },
  );
});
