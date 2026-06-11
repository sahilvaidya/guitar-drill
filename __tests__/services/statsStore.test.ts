import {
  loadLifetimeStats,
  recordAttempt,
  loadPracticeMode,
  savePracticeMode,
  loadFretRange,
  saveFretRange,
  loadRecentMisses,
  recordMiss,
  loadTimingStats,
  recordCorrectAnswerDuration,
  loadSpeedGameBestScore,
  recordSpeedGameScore,
  loadEarLifetimeStats,
  recordEarIntervalAttempt,
  loadEarTrainingSettings,
  saveEarTrainingSettings,
  loadEarNoteLifetimeStats,
  recordEarNoteAttempt,
  loadEarNoteSettings,
  saveEarNoteSettings,
  EMPTY_LIFETIME_STATS,
  EMPTY_EAR_LIFETIME_STATS,
  EMPTY_EAR_NOTE_LIFETIME_STATS,
} from '../../src/services/statsStore';

const store: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { store[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete store[key]; return Promise.resolve(); }),
  clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); return Promise.resolve(); }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(store).forEach(k => delete store[k]);
});

describe('lifetimeStats', () => {
  test('returns empty stats when nothing stored', async () => {
    const stats = await loadLifetimeStats();
    expect(stats).toEqual(EMPTY_LIFETIME_STATS);
  });

  test('recordAttempt increments counters', async () => {
    await recordAttempt({ correct: true, currentStreak: 1, isFirstTry: true, isSolvedPrompt: true });
    const stats = await loadLifetimeStats();
    expect(stats.totalAnswers).toBe(1);
    expect(stats.correctAnswers).toBe(1);
    expect(stats.firstTryCorrectAnswers).toBe(1);
    expect(stats.solvedPrompts).toBe(1);
    expect(stats.bestStreak).toBe(1);
  });

  test('incorrect attempt increments incorrectGuesses', async () => {
    await recordAttempt({ correct: false, currentStreak: 0, isFirstTry: true, isSolvedPrompt: false });
    const stats = await loadLifetimeStats();
    expect(stats.incorrectGuesses).toBe(1);
    expect(stats.correctAnswers).toBe(0);
  });

  test('best streak is updated', async () => {
    await recordAttempt({ correct: true, currentStreak: 5, isFirstTry: true, isSolvedPrompt: true });
    await recordAttempt({ correct: true, currentStreak: 3, isFirstTry: true, isSolvedPrompt: true });
    const stats = await loadLifetimeStats();
    expect(stats.bestStreak).toBe(5);
  });
});

describe('practiceMode', () => {
  test('defaults to natural', async () => {
    expect(await loadPracticeMode()).toBe('natural');
  });

  test('persists chromatic', async () => {
    await savePracticeMode('chromatic');
    expect(await loadPracticeMode()).toBe('chromatic');
  });
});

describe('fretRange', () => {
  test('defaults to 0-12', async () => {
    const range = await loadFretRange();
    expect(range).toEqual({ start: 0, end: 12 });
  });

  test('persists custom range', async () => {
    await saveFretRange({ start: 3, end: 7 });
    expect(await loadFretRange()).toEqual({ start: 3, end: 7 });
  });
});

describe('recentMisses', () => {
  test('starts empty', async () => {
    expect(await loadRecentMisses()).toEqual([]);
  });

  test('stores a miss', async () => {
    const miss = { position: { stringIndex: 0, fret: 5 }, correct: 'A' as const, selected: 'B' as const };
    await recordMiss(miss);
    const misses = await loadRecentMisses();
    expect(misses).toHaveLength(1);
    expect(misses[0]).toEqual(miss);
  });

  test('caps at 5 entries', async () => {
    for (let i = 0; i < 7; i++) {
      await recordMiss({ position: { stringIndex: i % 6, fret: i }, correct: 'A' as const, selected: 'B' as const });
    }
    expect(await loadRecentMisses()).toHaveLength(5);
  });

  test('newest miss is first', async () => {
    await recordMiss({ position: { stringIndex: 0, fret: 1 }, correct: 'A' as const, selected: 'B' as const });
    await recordMiss({ position: { stringIndex: 0, fret: 2 }, correct: 'C' as const, selected: 'D' as const });
    const misses = await loadRecentMisses();
    expect(misses[0].position.fret).toBe(2);
  });
});

describe('timingStats', () => {
  test('starts empty', async () => {
    const t = await loadTimingStats();
    expect(t.recentDurations).toEqual([]);
    expect(t.averageDuration).toBeNull();
  });

  test('records duration and computes average', async () => {
    await recordCorrectAnswerDuration(4);
    await recordCorrectAnswerDuration(6);
    const t = await loadTimingStats();
    expect(t.recentDurations).toHaveLength(2);
    expect(t.averageDuration).toBe(5);
  });

  test('caps at 5 durations', async () => {
    for (let i = 0; i < 7; i++) await recordCorrectAnswerDuration(i + 1);
    const t = await loadTimingStats();
    expect(t.recentDurations).toHaveLength(5);
  });
});

describe('speedGameBestScore', () => {
  test('defaults to 0 when nothing stored', async () => {
    expect(await loadSpeedGameBestScore()).toBe(0);
  });

  test('records a new best score', async () => {
    const best = await recordSpeedGameScore(12);
    expect(best).toBe(12);
    expect(await loadSpeedGameBestScore()).toBe(12);
  });

  test('keeps the higher score', async () => {
    await recordSpeedGameScore(12);
    const best = await recordSpeedGameScore(7);
    expect(best).toBe(12);
    expect(await loadSpeedGameBestScore()).toBe(12);
  });

  test('recovers from corrupt stored value', async () => {
    store['speedGameBestScore'] = 'not-a-number';
    expect(await loadSpeedGameBestScore()).toBe(0);
  });
});

describe('earIntervalStats', () => {
  test('returns empty stats when nothing stored', async () => {
    expect(await loadEarLifetimeStats()).toEqual(EMPTY_EAR_LIFETIME_STATS);
  });

  test('recordEarIntervalAttempt increments counters', async () => {
    await recordEarIntervalAttempt({ correct: true, currentStreak: 1, isFirstTry: true, isSolvedPrompt: true });
    await recordEarIntervalAttempt({ correct: false, currentStreak: 0, isFirstTry: true, isSolvedPrompt: false });
    const stats = await loadEarLifetimeStats();
    expect(stats.totalAnswers).toBe(2);
    expect(stats.correctAnswers).toBe(1);
    expect(stats.firstTryCorrectAnswers).toBe(1);
    expect(stats.solvedPrompts).toBe(1);
    expect(stats.bestStreak).toBe(1);
  });

  test('recovers from corrupt stored value', async () => {
    store['earIntervalStats'] = '{not json';
    expect(await loadEarLifetimeStats()).toEqual(EMPTY_EAR_LIFETIME_STATS);
  });
});

describe('earTrainingSettings', () => {
  test('defaults to ascending / beginner', async () => {
    expect(await loadEarTrainingSettings()).toEqual({ direction: 'ascending', level: 'beginner' });
  });

  test('persists custom settings', async () => {
    await saveEarTrainingSettings({ direction: 'mixed', level: 'intermediate' });
    expect(await loadEarTrainingSettings()).toEqual({ direction: 'mixed', level: 'intermediate' });
  });

  test('falls back to defaults for unrecognized stored values', async () => {
    store['earTrainingSettings'] = JSON.stringify({ direction: 'sideways', level: 'expert' });
    expect(await loadEarTrainingSettings()).toEqual({ direction: 'ascending', level: 'beginner' });
  });
});

describe('earNoteStats', () => {
  test('returns empty stats when nothing stored', async () => {
    expect(await loadEarNoteLifetimeStats()).toEqual(EMPTY_EAR_NOTE_LIFETIME_STATS);
  });

  test('recordEarNoteAttempt increments counters', async () => {
    await recordEarNoteAttempt({ correct: true, currentStreak: 1, isFirstTry: true, isSolvedPrompt: true });
    await recordEarNoteAttempt({ correct: false, currentStreak: 0, isFirstTry: true, isSolvedPrompt: false });
    const stats = await loadEarNoteLifetimeStats();
    expect(stats.totalAnswers).toBe(2);
    expect(stats.correctAnswers).toBe(1);
    expect(stats.firstTryCorrectAnswers).toBe(1);
    expect(stats.solvedPrompts).toBe(1);
    expect(stats.bestStreak).toBe(1);
  });

  test('recovers from corrupt stored value', async () => {
    store['earNoteStats'] = '{not json';
    expect(await loadEarNoteLifetimeStats()).toEqual(EMPTY_EAR_NOTE_LIFETIME_STATS);
  });
});

describe('earNoteSettings', () => {
  test('defaults to natural', async () => {
    expect(await loadEarNoteSettings()).toEqual({ noteSet: 'natural' });
  });

  test('persists chromatic', async () => {
    await saveEarNoteSettings({ noteSet: 'chromatic' });
    expect(await loadEarNoteSettings()).toEqual({ noteSet: 'chromatic' });
  });

  test('falls back to default for unrecognized stored value', async () => {
    store['earNoteSettings'] = JSON.stringify({ noteSet: 'pentatonic' });
    expect(await loadEarNoteSettings()).toEqual({ noteSet: 'natural' });
  });

  test('round-trips natural → chromatic → natural', async () => {
    await saveEarNoteSettings({ noteSet: 'chromatic' });
    expect(await loadEarNoteSettings()).toEqual({ noteSet: 'chromatic' });
    await saveEarNoteSettings({ noteSet: 'natural' });
    expect(await loadEarNoteSettings()).toEqual({ noteSet: 'natural' });
  });
});
