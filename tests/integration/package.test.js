// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { PACKAGE_FILES, packageExtension } from '../../scripts/package.js';

const REPO_DIR = fileURLToPath(new URL('../../', import.meta.url));
const PACKAGE_SCRIPT = join(REPO_DIR, 'scripts/package.js');

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

/**
 * Writes a small extension project: the files that belong in the zip, plus
 * decoys that must stay out.
 *
 * @param {string} version The manifest version.
 * @param {Record<string, string>} [extraFiles] More files, by relative path.
 * @returns {string} The project folder.
 */
function makeProject(version, extraFiles = {}) {
  const rootDir = makeTempDir();
  const files = {
    'manifest.json': JSON.stringify({ manifest_version: 3, version }),
    'README.md': '# Fixture',
    'USER-GUIDE.md': '# Fixture guide',
    'src/content/main.js': '',
    'popup/popup.html': '',
    'icons/icon16.png': '',
    'tests/unit/a.test.js': '',
    'node_modules/pkg/index.js': '',
    ...extraFiles,
  };
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(rootDir, path)), { recursive: true });
    writeFileSync(join(rootDir, path), content);
  }
  return rootDir;
}

/**
 * Reads the `manifest.json` stored in a zip.
 *
 * @param {string} zipPath The zip to read.
 * @returns {any} The parsed manifest.
 */
function zippedManifest(zipPath) {
  return JSON.parse(
    execFileSync('unzip', ['-p', zipPath, 'manifest.json'], {
      encoding: 'utf8',
    }),
  );
}

/** A manifest as the repo keeps it: with the `key` that pins the local ID. */
const KEYED_MANIFEST = {
  manifest_version: 3,
  name: 'Fixture',
  version: '2.0.0',
  key: 'PUBLIC-KEY',
};

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('npm run package', () => {
  it('builds dist/yt-skip-ad-<version>.zip containing only the extension files', () => {
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
        'USER-GUIDE.md',
        'src/content/loader.js',
        'src/background/service-worker.js',
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
  });

  it('names the zip with the version in manifest.json', () => {
    // GIVEN a project whose manifest says 9.9.9
    const rootDir = makeProject('9.9.9');
    const outDir = makeTempDir();
    // WHEN it is packaged
    const zipPath = packageExtension({ rootDir, outDir });
    // THEN the zip is in the output folder, named for that version
    expect(zipPath).toBe(join(outDir, 'yt-skip-ad-9.9.9.zip'));
    expect(zipEntries(zipPath)).toContain('manifest.json');
  });

  it('leaves out dotfiles and private keys, even inside included folders', () => {
    // GIVEN a project with stray dotfiles and a key beside the extension files
    const rootDir = makeProject('1.0.0', {
      '.env': '',
      'src/.DS_Store': '',
      'popup/.hidden/note.js': '',
      'src/key.pem': '',
      'icons/key.pem': '',
    });
    const outDir = makeTempDir();
    // WHEN it is packaged
    const entries = zipEntries(packageExtension({ rootDir, outDir }));
    // THEN only the extension files are in the zip
    expect(entries.sort()).toEqual([
      'README.md',
      'USER-GUIDE.md',
      'icons/icon16.png',
      'manifest.json',
      'popup/popup.html',
      'src/content/main.js',
    ]);
  });

  it("a second run replaces the zip, so deleted files don't linger in it", () => {
    // GIVEN a project packaged once while it had src/old.js
    const rootDir = makeProject('1.0.0', { 'src/old.js': '' });
    const outDir = makeTempDir();
    packageExtension({ rootDir, outDir });
    // WHEN src/old.js is deleted and the same version is packaged again
    rmSync(join(rootDir, 'src/old.js'));
    const entries = zipEntries(packageExtension({ rootDir, outDir }));
    // THEN the new zip no longer holds it
    expect(entries).not.toContain('src/old.js');
    expect(entries).toContain('src/content/main.js');
  });

  it('without zip installed, stops with a clear [yt-skip-ad] message and no zip', () => {
    // GIVEN a machine where the zip command can't be found
    const outDir = makeTempDir();
    // WHEN the package script runs, as npm run package does
    const run = spawnSync(process.execPath, [PACKAGE_SCRIPT, outDir], {
      cwd: REPO_DIR,
      encoding: 'utf8',
      env: { ...process.env, PATH: '' },
    });
    // THEN it fails with a message naming the missing command, and writes nothing
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(
      "[yt-skip-ad] can't build the dist zip: the zip command is not installed",
    );
    expect(readdirSync(outDir)).toEqual([]);
  });

  it('builds the store zip with the same files and a manifest without key', () => {
    // GIVEN a project whose manifest carries the key that pins the local ID
    const rootDir = makeProject('2.0.0', {
      'manifest.json': JSON.stringify(KEYED_MANIFEST),
    });
    const outDir = makeTempDir();
    const distEntries = zipEntries(packageExtension({ rootDir, outDir }));
    // WHEN it is packaged for the Chrome Web Store
    const zipPath = packageExtension({ rootDir, outDir, store: true });
    // THEN the store zip has the dist zip's files, and a manifest that is the
    // repo's minus the key, since the store sets its own
    expect(zipPath).toBe(join(outDir, 'yt-skip-ad-2.0.0-store.zip'));
    expect(zipEntries(zipPath).sort()).toEqual(distEntries.sort());
    const { key, ...rest } = KEYED_MANIFEST;
    expect(key).toBeTruthy();
    expect(zippedManifest(zipPath)).toEqual(rest);
  });

  it('keeps the key in the dist zip for colleagues', () => {
    // GIVEN a project whose manifest carries the key
    const rootDir = makeProject('2.0.0', {
      'manifest.json': JSON.stringify(KEYED_MANIFEST),
    });
    // WHEN it is packaged for colleagues, as before
    const zipPath = packageExtension({ rootDir, outDir: makeTempDir() });
    // THEN its manifest is the repo's, key included, so the ID stays pinned
    expect(zippedManifest(zipPath)).toEqual(KEYED_MANIFEST);
  });

  it('npm run package:store writes the store zip from the command line', () => {
    // GIVEN the repo
    const outDir = makeTempDir();
    // WHEN the package script runs with --store, as npm run package:store does
    const run = spawnSync(
      process.execPath,
      [PACKAGE_SCRIPT, '--store', outDir],
      { cwd: REPO_DIR, encoding: 'utf8' },
    );
    // THEN it prints the store zip's path, and that zip has no key
    expect(run.status).toBe(0);
    const zipPath = run.stdout.trim();
    expect(basename(zipPath)).toMatch(/^yt-skip-ad-[\d.]+-store\.zip$/);
    expect(zippedManifest(zipPath)).not.toHaveProperty('key');
    const pkg = JSON.parse(
      readFileSync(join(REPO_DIR, 'package.json'), 'utf8'),
    );
    expect(pkg.scripts['package:store']).toBe(
      'node scripts/package.js --store',
    );
  });
});
