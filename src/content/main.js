// Content-script entry (ES module), loaded by loader.js on YouTube pages.
// Wiring only: the rules live in src/core/.

import { findPlayer } from '../core/ad-detection.js';
import { createSkipper } from '../core/skipper.js';
import { LOG_PREFIX } from '../shared/constants.js';

console.log(`${LOG_PREFIX} content script loaded`);

const player = findPlayer(document);
if (player) createSkipper().check(player);
