// Builds the dist zip colleagues install from. Dev tooling only: the
// extension itself has no build step.

/** Repo paths that make up the extension; nothing else goes in the zip. */
/** @type {string[]} */
export const PACKAGE_FILES = [];

/**
 * Zips the extension files.
 *
 * @param {{ rootDir: string, outDir: string }} options Repo and output folders.
 * @returns {string} Path of the zip written.
 */
export function packageExtension(options) {
  void options;
  throw new Error('not built yet');
}
