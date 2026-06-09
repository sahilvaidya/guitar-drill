import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotePracticeMode, DEFAULT_PRACTICE_MODE } from '@/domain/notePracticeMode';
import { FretRange, DEFAULT_FRET_RANGE } from '@/domain/fretRange';
import { NoteName } from '@/domain/noteName';
import { FretPosition } from '@/domain/fretPosition';

const KEYS = {
  lifetimeStats: 'lifetimeStats',
  practiceMode: 'practiceMode',
  fretRange: 'fretRange',
  recentMisses: 'recentMisses',
  timingStats: 'timingStats',
  inverseLifetimeStats: 'inverseLifetimeStats',
  inverseMissedNotes: 'inverseMissedNotes',
  speedGameBestScore: 'speedGameBestScore',
} as const;

// ── Types ──────────────────────────────────────────────────────────────────

export interface LifetimeStats {
  totalAnswers: number;
  correctAnswers: number;
  bestStreak: number;
  solvedPrompts: number;
  firstTryCorrectAnswers: number;
  incorrectGuesses: number;
}

export const EMPTY_LIFETIME_STATS: LifetimeStats = {
  totalAnswers: 0,
  correctAnswers: 0,
  bestStreak: 0,
  solvedPrompts: 0,
  firstTryCorrectAnswers: 0,
  incorrectGuesses: 0,
};

export interface RecentMiss {
  position: { stringIndex: number; fret: number };
  correct: NoteName;
  selected: NoteName;
}

export interface InverseLifetimeStats {
  totalAttempts: number;
  solvedPrompts: number;
  bestStreak: number;
}

export const EMPTY_INVERSE_LIFETIME_STATS: InverseLifetimeStats = {
  totalAttempts: 0,
  solvedPrompts: 0,
  bestStreak: 0,
};

export interface PromptTimingStats {
  recentDurations: number[];
  averageDuration: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function average(durations: number[]): number | null {
  if (durations.length === 0) return null;
  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

function parseLifetimeStats(raw: unknown): LifetimeStats {
  if (typeof raw !== 'object' || raw === null) return EMPTY_LIFETIME_STATS;
  const r = raw as Record<string, unknown>;
  return {
    totalAnswers:          typeof r.totalAnswers === 'number'          ? r.totalAnswers          : 0,
    correctAnswers:        typeof r.correctAnswers === 'number'        ? r.correctAnswers        : 0,
    bestStreak:            typeof r.bestStreak === 'number'            ? r.bestStreak            : 0,
    solvedPrompts:         typeof r.solvedPrompts === 'number'         ? r.solvedPrompts         : 0,
    firstTryCorrectAnswers:typeof r.firstTryCorrectAnswers === 'number'? r.firstTryCorrectAnswers: 0,
    incorrectGuesses:      typeof r.incorrectGuesses === 'number'      ? r.incorrectGuesses      : 0,
  };
}

// ── StatsStore ─────────────────────────────────────────────────────────────

export async function loadLifetimeStats(): Promise<LifetimeStats> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.lifetimeStats);
    if (!raw) return EMPTY_LIFETIME_STATS;
    return parseLifetimeStats(JSON.parse(raw));
  } catch {
    return EMPTY_LIFETIME_STATS;
  }
}

export async function recordAttempt(params: {
  correct: boolean;
  currentStreak: number;
  isFirstTry: boolean;
  isSolvedPrompt: boolean;
}): Promise<void> {
  const stats = await loadLifetimeStats();
  const updated: LifetimeStats = {
    totalAnswers:           stats.totalAnswers + 1,
    correctAnswers:         params.correct ? stats.correctAnswers + 1 : stats.correctAnswers,
    bestStreak:             Math.max(stats.bestStreak, params.currentStreak),
    solvedPrompts:          params.isSolvedPrompt ? stats.solvedPrompts + 1 : stats.solvedPrompts,
    firstTryCorrectAnswers: params.isFirstTry && params.correct ? stats.firstTryCorrectAnswers + 1 : stats.firstTryCorrectAnswers,
    incorrectGuesses:       !params.correct ? stats.incorrectGuesses + 1 : stats.incorrectGuesses,
  };
  await AsyncStorage.setItem(KEYS.lifetimeStats, JSON.stringify(updated));
}

export async function loadPracticeMode(): Promise<NotePracticeMode> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.practiceMode);
    if (raw === 'natural' || raw === 'chromatic') return raw;
    return DEFAULT_PRACTICE_MODE;
  } catch {
    return DEFAULT_PRACTICE_MODE;
  }
}

export async function savePracticeMode(mode: NotePracticeMode): Promise<void> {
  await AsyncStorage.setItem(KEYS.practiceMode, mode);
}

export async function loadFretRange(): Promise<FretRange> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.fretRange);
    if (!raw) return DEFAULT_FRET_RANGE;
    const parsed = JSON.parse(raw);
    if (typeof parsed.start === 'number' && typeof parsed.end === 'number') {
      return { start: parsed.start, end: parsed.end };
    }
    return DEFAULT_FRET_RANGE;
  } catch {
    return DEFAULT_FRET_RANGE;
  }
}

export async function saveFretRange(range: FretRange): Promise<void> {
  await AsyncStorage.setItem(KEYS.fretRange, JSON.stringify(range));
}

export async function loadRecentMisses(): Promise<RecentMiss[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.recentMisses);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function recordMiss(miss: RecentMiss): Promise<void> {
  const misses = await loadRecentMisses();
  const updated = [miss, ...misses].slice(0, 5);
  await AsyncStorage.setItem(KEYS.recentMisses, JSON.stringify(updated));
}

export async function loadTimingStats(): Promise<PromptTimingStats> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.timingStats);
    if (!raw) return { recentDurations: [], averageDuration: null };
    const durations = JSON.parse(raw);
    if (!Array.isArray(durations)) return { recentDurations: [], averageDuration: null };
    return { recentDurations: durations, averageDuration: average(durations) };
  } catch {
    return { recentDurations: [], averageDuration: null };
  }
}

export async function recordCorrectAnswerDuration(duration: number): Promise<void> {
  const { recentDurations } = await loadTimingStats();
  const updated = [duration, ...recentDurations].slice(0, 5);
  await AsyncStorage.setItem(KEYS.timingStats, JSON.stringify(updated));
}

// ── Inverse Note Finder stats ──────────────────────────────────────────────

export async function loadInverseLifetimeStats(): Promise<InverseLifetimeStats> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.inverseLifetimeStats);
    if (!raw) return EMPTY_INVERSE_LIFETIME_STATS;
    const r = JSON.parse(raw) as Record<string, unknown>;
    return {
      totalAttempts: typeof r.totalAttempts === 'number' ? r.totalAttempts : 0,
      solvedPrompts: typeof r.solvedPrompts === 'number' ? r.solvedPrompts : 0,
      bestStreak:    typeof r.bestStreak === 'number' ? r.bestStreak : 0,
    };
  } catch {
    return EMPTY_INVERSE_LIFETIME_STATS;
  }
}

export async function recordInverseAttempt(params: {
  solved: boolean;
  currentStreak: number;
}): Promise<void> {
  const stats = await loadInverseLifetimeStats();
  const updated: InverseLifetimeStats = {
    totalAttempts: stats.totalAttempts + 1,
    solvedPrompts: params.solved ? stats.solvedPrompts + 1 : stats.solvedPrompts,
    bestStreak:    Math.max(stats.bestStreak, params.currentStreak),
  };
  await AsyncStorage.setItem(KEYS.inverseLifetimeStats, JSON.stringify(updated));
}

export async function loadInverseMissedNotes(): Promise<NoteName[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.inverseMissedNotes);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function recordInverseMiss(note: NoteName): Promise<void> {
  const notes = await loadInverseMissedNotes();
  const updated = [note, ...notes].slice(0, 10);
  await AsyncStorage.setItem(KEYS.inverseMissedNotes, JSON.stringify(updated));
}

// ── Speed Game ─────────────────────────────────────────────────────────────

export async function loadSpeedGameBestScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.speedGameBestScore);
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

/** Persist the score if it beats the stored best; returns the current best. */
export async function recordSpeedGameScore(score: number): Promise<number> {
  const best = await loadSpeedGameBestScore();
  const newBest = Math.max(best, score);
  await AsyncStorage.setItem(KEYS.speedGameBestScore, String(newBest));
  return newBest;
}
