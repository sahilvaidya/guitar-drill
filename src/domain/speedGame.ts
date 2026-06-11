export type SpeedDifficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  threshold: number;
  wrongPenalty: number;
  label: string;
}

export const DIFFICULTY_CONFIGS: Record<SpeedDifficulty, DifficultyConfig> = {
  hard:   { threshold: 2,  wrongPenalty: 1,  label: 'Hard' },
  normal: { threshold: 5,  wrongPenalty: 2,  label: 'Normal' },
  easy:   { threshold: 15, wrongPenalty: 4,  label: 'Easy' },
};

export const DIFFICULTIES: SpeedDifficulty[] = ['easy', 'normal', 'hard'];
export const DEFAULT_DIFFICULTY: SpeedDifficulty = 'normal';

export const ROLLING_WINDOW = 5;
/** Kept for backward compat with tests (equals DIFFICULTY_CONFIGS.normal.threshold). */
export const THRESHOLD_SECONDS = 5;
/** Kept for backward compat with tests (the old single-penalty value). */
export const WRONG_TAP_PENALTY_SECONDS = 6;

/** Average of the last `window` entries, or null when there are none. */
export function rollingAverage(times: number[], window = ROLLING_WINDOW): number | null {
  if (times.length === 0) return null;
  const recent = times.slice(-window);
  return recent.reduce((a, b) => a + b, 0) / recent.length;
}

/** Game over when the rolling average exceeds the threshold. */
export function isGameOver(times: number[], threshold = THRESHOLD_SECONDS): boolean {
  const avg = rollingAverage(times);
  return avg !== null && avg > threshold;
}
