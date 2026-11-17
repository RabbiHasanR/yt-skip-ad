// Content-script entry (ES module), loaded by loader.js on YouTube pages.

import { LOG_PREFIX } from '../shared/constants.js';
import { followPlayer } from './follow-player.js';

console.log(`${LOG_PREFIX} content script loaded`);

followPlayer(document);
