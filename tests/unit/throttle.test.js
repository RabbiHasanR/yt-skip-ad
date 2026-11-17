import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThrottle } from '../../src/core/throttle.js';

const WAIT_MS = 100;

describe('createThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs once, after the wait, for a burst of calls', () => {
    // GIVEN a throttled function
    const run = vi.fn();
    const schedule = createThrottle(run, WAIT_MS);
    // WHEN it is called in a burst, part-way through the wait
    schedule();
    vi.advanceTimersByTime(WAIT_MS / 2);
    schedule();
    schedule();
    // THEN it runs once, a full wait after the first call, not the last
    vi.advanceTimersByTime(WAIT_MS / 2 - 1);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(WAIT_MS * 2);
    expect(run).toHaveBeenCalledOnce();
  });

  it('runs again for calls made after the previous run', () => {
    // GIVEN a throttled function that has already run once
    const run = vi.fn();
    const schedule = createThrottle(run, WAIT_MS);
    schedule();
    vi.advanceTimersByTime(WAIT_MS);
    // WHEN it is called again
    schedule();
    vi.advanceTimersByTime(WAIT_MS);
    // THEN it runs again
    expect(run).toHaveBeenCalledTimes(2);
  });
});
