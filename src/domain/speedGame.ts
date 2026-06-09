/**
 * Speed Game rules.
 *
 * The player must keep the rolling average response time of the last
 * ROLLING_WINDOW solved prompts at or below THRESHOLD_SECONDS.  Wrong taps
 * add WRONG_TAP_PENALTY_SECONDS to the current prompt's response time.
 */

export const ROLLING_WINDOW = 5;
export const THRESHOLD_SECONDS = 5;
export const WRONG_TAP_PENALTY_SECONDS = 6;

/** Average of the last `window` entries, or null when there are none. */
export function rollingAverage(times: number[], window = ROLLING_WINDOW): number | null {
  if (times.length === 0) return null;
  const recent = times.slice(-window);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

/** Game over when the rolling average exceeds the threshold. */
export function isGameOver(times: number[]): boolean {
  const avg = rollingAverage(times);
  return avg !== null && avg > THRESHOLD_SECONDS;
}
