const storage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(storage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { storage[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete storage[key]; return Promise.resolve(); }),
}));

import { useSpeedGame } from '@/store/useSpeedGame';
import { loadSpeedGameBestScore, recordSpeedGameScore } from '@/services/statsStore';
import { normalizeToCanonical } from '@/domain/noteName';

let t: number;

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(storage).forEach(k => delete storage[k]);
  t = 0;
  useSpeedGame.setState({ now: () => t, rng: () => 0.42 });
});

function state() {
  return useSpeedGame.getState();
}

function correctChoice(): string {
  const s = state();
  return s.choices.find(c => normalizeToCanonical(c) === s.prompt!.correctAnswer)!;
}

function wrongChoice(): string {
  const s = state();
  return s.choices.find(c => normalizeToCanonical(c) !== s.prompt!.correctAnswer)!;
}

/** Advance the fake clock by `seconds` and answer the current prompt correctly. */
async function answerCorrectAfter(seconds: number) {
  t += seconds * 1000;
  await state().answer(correctChoice());
}

describe('useSpeedGame', () => {
  it('start() initializes a fresh playing state', async () => {
    await state().start();
    const s = state();
    expect(s.status).toBe('playing');
    expect(s.prompt).not.toBeNull();
    expect(s.score).toBe(0);
    expect(s.times).toEqual([]);
    expect(s.currentPenalty).toBe(0);
    expect(s.bestScore).toBe(0);
  });

  it('always offers 3 choices including the correct answer', async () => {
    await state().start();
    for (let i = 0; i < 10; i++) {
      const s = state();
      expect(s.choices).toHaveLength(3);
      expect(new Set(s.choices).size).toBe(3);
      expect(s.choices.some(c => normalizeToCanonical(c) === s.prompt!.correctAnswer)).toBe(true);
      await answerCorrectAfter(1);
    }
  });

  it('correct answer records the response time and advances immediately', async () => {
    await state().start();
    const firstPrompt = state().prompt;
    await answerCorrectAfter(1.5);
    const s = state();
    expect(s.status).toBe('playing');
    expect(s.score).toBe(1);
    expect(s.times).toEqual([1.5]);
    expect(s.prompt).not.toBe(firstPrompt);
    expect(s.promptPresentedAt).toBe(t);
  });

  it('wrong tap adds a 2s penalty on normal difficulty and the prompt retries', async () => {
    await state().start();
    // Build a buffer of fast answers so the penalty is survivable
    for (let i = 0; i < 4; i++) await answerCorrectAfter(1);

    t += 500;
    const wrong = wrongChoice();
    await state().answer(wrong);
    let s = state();
    expect(s.status).toBe('playing');
    expect(s.currentPenalty).toBe(2);
    expect(s.wrongFlash).toBe(wrong);
    expect(s.score).toBe(4);

    // Solving the prompt records elapsed + penalty
    t += 500;
    await state().answer(correctChoice());
    s = state();
    expect(s.status).toBe('playing');
    expect(s.score).toBe(5);
    expect(s.times[4]).toBeCloseTo(1 + 2); // 1s elapsed + 2s penalty
    expect(s.currentPenalty).toBe(0);
    expect(s.wrongFlash).toBeNull();
  });

  it('game over fires when the rolling average exceeds 5s on normal difficulty', async () => {
    await state().start();
    await answerCorrectAfter(26);
    const s = state();
    expect(s.status).toBe('gameOver');
    expect(s.score).toBe(1);
    expect(s.isNewBest).toBe(true);
    expect(await loadSpeedGameBestScore()).toBe(1);
  });

  it('wrong tap on a slow prompt ends the game on normal difficulty', async () => {
    await state().start();
    // 4s elapsed + 2s penalty = 6s > 5s threshold → game over
    t += 4000;
    await state().answer(wrongChoice());
    const s = state();
    expect(s.status).toBe('gameOver');
    expect(s.score).toBe(0);
    expect(s.isNewBest).toBe(false);
  });

  it('answers are ignored after game over', async () => {
    await state().start();
    await answerCorrectAfter(26);
    expect(state().status).toBe('gameOver');
    const scoreBefore = state().score;
    await state().answer(wrongChoice());
    expect(state().score).toBe(scoreBefore);
    expect(state().status).toBe('gameOver');
  });

  it('keeps the stored best when the run does not beat it', async () => {
    await recordSpeedGameScore(5);
    await state().start();
    expect(state().bestScore).toBe(5);

    await answerCorrectAfter(26); // game over with score 1
    const s = state();
    expect(s.status).toBe('gameOver');
    expect(s.bestScore).toBe(5);
    expect(s.isNewBest).toBe(false);
    expect(await loadSpeedGameBestScore()).toBe(5);
  });

  it('updates the stored best when the run beats it', async () => {
    await recordSpeedGameScore(5);
    await state().start();

    for (let i = 0; i < 6; i++) await answerCorrectAfter(1);
    expect(state().status).toBe('playing');
    await answerCorrectAfter(26); // avg of last 5 = (1+1+1+1+26)/5 = 6 → game over
    const s = state();
    expect(s.status).toBe('gameOver');
    expect(s.score).toBe(7);
    expect(s.bestScore).toBe(7);
    expect(s.isNewBest).toBe(true);
    expect(await loadSpeedGameBestScore()).toBe(7);
  });

  it('start() after game over resets for a new run', async () => {
    await state().start();
    await answerCorrectAfter(26);
    expect(state().status).toBe('gameOver');

    await state().start();
    const s = state();
    expect(s.status).toBe('playing');
    expect(s.score).toBe(0);
    expect(s.times).toEqual([]);
    expect(s.bestScore).toBe(1); // best from the previous run
  });
});
