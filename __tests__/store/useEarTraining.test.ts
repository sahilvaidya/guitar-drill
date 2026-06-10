const storage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(storage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { storage[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete storage[key]; return Promise.resolve(); }),
}));

import { useEarTraining } from '@/store/useEarTraining';
import { IntervalName, LEVEL_INTERVALS } from '@/domain/earInterval';
import {
  loadEarLifetimeStats, loadEarTrainingSettings, saveEarTrainingSettings,
} from '@/services/statsStore';

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(storage).forEach(k => delete storage[k]);
  useEarTraining.setState({
    prompt: null,
    feedback: null,
    sessionStats: { solvedPrompts: 0, attempts: 0, streak: 0, incorrectThisPrompt: 0 },
    rng: () => 0.42,
  });
});

function state() {
  return useEarTraining.getState();
}

function wrongAnswer(): IntervalName {
  const s = state();
  return LEVEL_INTERVALS[s.settings.level].find(i => i !== s.prompt!.interval)!;
}

describe('useEarTraining', () => {
  it('initialize() loads defaults and generates a prompt', async () => {
    await state().initialize();
    const s = state();
    expect(s.prompt).not.toBeNull();
    expect(s.settings).toEqual({ direction: 'ascending', level: 'beginner' });
    expect(LEVEL_INTERVALS.beginner).toContain(s.prompt!.interval);
    expect(s.prompt!.direction).toBe('ascending');
  });

  it('initialize() restores persisted settings', async () => {
    await saveEarTrainingSettings({ direction: 'harmonic', level: 'advanced' });
    await state().initialize();
    const s = state();
    expect(s.settings).toEqual({ direction: 'harmonic', level: 'advanced' });
    expect(s.prompt!.direction).toBe('harmonic');
  });

  it('a correct answer sets feedback, bumps streak, and persists the attempt', async () => {
    await state().initialize();
    await state().submit(state().prompt!.interval);
    const s = state();
    expect(s.feedback).toEqual({ answer: s.prompt!.interval, isCorrect: true });
    expect(s.sessionStats.attempts).toBe(1);
    expect(s.sessionStats.streak).toBe(1);

    const lifetime = await loadEarLifetimeStats();
    expect(lifetime.totalAnswers).toBe(1);
    expect(lifetime.correctAnswers).toBe(1);
    expect(lifetime.firstTryCorrectAnswers).toBe(1);
    expect(lifetime.solvedPrompts).toBe(1);
    expect(lifetime.bestStreak).toBe(1);
    expect(s.lifetimeStats).toEqual(lifetime);
  });

  it('a wrong answer resets the streak and keeps the prompt for retry', async () => {
    await state().initialize();
    await state().submit(state().prompt!.interval);
    state().nextPrompt();

    const prompt = state().prompt;
    await state().submit(wrongAnswer());
    let s = state();
    expect(s.feedback!.isCorrect).toBe(false);
    expect(s.sessionStats.streak).toBe(0);
    expect(s.prompt).toBe(prompt); // same prompt, retry allowed

    // retry succeeds but no longer counts as first-try
    await state().submit(prompt!.interval);
    s = state();
    expect(s.feedback!.isCorrect).toBe(true);
    const lifetime = await loadEarLifetimeStats();
    expect(lifetime.totalAnswers).toBe(3);
    expect(lifetime.correctAnswers).toBe(2);
    expect(lifetime.firstTryCorrectAnswers).toBe(1);
    expect(lifetime.solvedPrompts).toBe(1);
  });

  it('ignores submissions after a correct answer', async () => {
    await state().initialize();
    await state().submit(state().prompt!.interval);
    await state().submit(wrongAnswer());
    const lifetime = await loadEarLifetimeStats();
    expect(lifetime.totalAnswers).toBe(1);
    expect(state().sessionStats.attempts).toBe(1);
  });

  it('nextPrompt() advances, counts the solve, and avoids interval repeats', async () => {
    await state().initialize();
    const first = state().prompt!;
    await state().submit(first.interval);
    state().nextPrompt();
    const s = state();
    expect(s.feedback).toBeNull();
    expect(s.sessionStats.solvedPrompts).toBe(1);
    expect(s.sessionStats.incorrectThisPrompt).toBe(0);
    expect(s.prompt!.interval).not.toBe(first.interval);
  });

  it('setDirection() persists and regenerates the prompt', async () => {
    await state().initialize();
    await state().setDirection('descending');
    expect(state().prompt!.direction).toBe('descending');
    expect(await loadEarTrainingSettings()).toEqual({ direction: 'descending', level: 'beginner' });
  });

  it('setLevel() persists and draws from the wider pool', async () => {
    await state().initialize();
    await state().setLevel('advanced');
    expect(state().settings.level).toBe('advanced');
    expect(await loadEarTrainingSettings()).toEqual({ direction: 'ascending', level: 'advanced' });
  });

  it('best streak survives across sessions', async () => {
    await state().initialize();
    for (let i = 0; i < 3; i++) {
      await state().submit(state().prompt!.interval);
      state().nextPrompt();
    }
    expect((await loadEarLifetimeStats()).bestStreak).toBe(3);

    // a fresh session keeps the lifetime best
    await state().initialize();
    expect(state().lifetimeStats.bestStreak).toBe(3);
    expect(state().sessionStats.streak).toBe(0);
  });
});
