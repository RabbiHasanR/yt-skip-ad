// Coalesces bursts of calls into one run. Timer-based on purpose:
// requestAnimationFrame stops in background tabs, and a debounce (wait for
// quiet) could starve while an ad's progress bar keeps changing the player.

/**
 * Makes a function that runs `run` once, `waitMs` after the first call of a
 * burst; calls made while a run is pending are dropped.
 *
 * @param {() => void} run The work to run.
 * @param {number} waitMs Milliseconds from the first call to the run.
 * @returns {() => void} Schedules a run unless one is already pending.
 */
export function createThrottle(run, waitMs) {
  let pending = false;
  return () => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      // Cleared first, so changes caused by `run` schedule a follow-up run.
      pending = false;
      run();
    }, waitMs);
  };
}
