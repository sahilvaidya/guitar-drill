import { create } from 'zustand';
import { QuizPrompt } from '@/domain/quizPrompt';
import { NotePracticeMode, DEFAULT_PRACTICE_MODE } from '@/domain/notePracticeMode';
import { FretRange, DEFAULT_FRET_RANGE } from '@/domain/fretRange';
import {
  AccidentalDisplay, displayNoteForAccidental, normalizeToCanonical,
} from '@/domain/noteName';
import {
  WRONG_TAP_PENALTY_SECONDS, isGameOver,
} from '@/domain/speedGame';
import { pickDistractors } from '@/domain/speedGameDistractors';
import { evaluate, makeRandomPrompt, QuizEngineConfig } from '@/services/quizEngine';
import {
  loadPracticeMode, loadFretRange, loadSpeedGameBestScore, recordSpeedGameScore,
} from '@/services/statsStore';

export type SpeedGameStatus = 'idle' | 'playing' | 'gameOver';

interface SpeedGameState {
  status: SpeedGameStatus;
  prompt: QuizPrompt | null;
  /** 3 shuffled display labels: the correct answer + 2 distractors. */
  choices: string[];
  /** Last wrong tap, kept briefly so the button can flash red. */
  wrongFlash: string | null;
  /** Solved prompts this run. */
  score: number;
  /** Response time per solved prompt in seconds, penalties included. */
  times: number[];
  /** Penalty seconds accrued on the current prompt from wrong taps. */
  currentPenalty: number;
  promptPresentedAt: number | null;
  bestScore: number;
  isNewBest: boolean;
  mode: NotePracticeMode;
  fretRange: FretRange;
  accidentalDisplay: AccidentalDisplay;
  // injectable for tests
  now: () => number;
  rng: () => number;
}

interface SpeedGameActions {
  start: () => Promise<void>;
  answer: (choice: string) => Promise<void>;
  clearWrongFlash: () => void;
}

function buildChoices(
  prompt: QuizPrompt,
  mode: NotePracticeMode,
  accidentalDisplay: AccidentalDisplay,
  rng: () => number,
): string[] {
  const [d1, d2] = pickDistractors(prompt, mode, rng);
  const labels = [prompt.correctAnswer, d1, d2].map(n =>
    displayNoteForAccidental(n, accidentalDisplay),
  );
  for (let i = labels.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  return labels;
}

export const useSpeedGame = create<SpeedGameState & SpeedGameActions>((set, get) => ({
  status: 'idle',
  prompt: null,
  choices: [],
  wrongFlash: null,
  score: 0,
  times: [],
  currentPenalty: 0,
  promptPresentedAt: null,
  bestScore: 0,
  isNewBest: false,
  mode: DEFAULT_PRACTICE_MODE,
  fretRange: DEFAULT_FRET_RANGE,
  accidentalDisplay: 'sharp',
  now: () => Date.now(),
  rng: Math.random,

  start: async () => {
    const [mode, fretRange, bestScore] = await Promise.all([
      loadPracticeMode(),
      loadFretRange(),
      loadSpeedGameBestScore(),
    ]);
    const { now, rng } = get();
    const config: QuizEngineConfig = { mode, fretRange };
    const accidentalDisplay: AccidentalDisplay = rng() < 0.5 ? 'sharp' : 'flat';
    const prompt = makeRandomPrompt(config);
    set({
      status: 'playing',
      prompt,
      choices: buildChoices(prompt, mode, accidentalDisplay, rng),
      wrongFlash: null,
      score: 0,
      times: [],
      currentPenalty: 0,
      promptPresentedAt: now(),
      bestScore,
      isNewBest: false,
      mode,
      fretRange,
      accidentalDisplay,
    });
  },

  answer: async (choice: string) => {
    const state = get();
    if (state.status !== 'playing' || !state.prompt) return;

    const correct = evaluate(normalizeToCanonical(choice), state.prompt);
    const elapsed = state.promptPresentedAt !== null
      ? (state.now() - state.promptPresentedAt) / 1000
      : 0;

    if (!correct) {
      const currentPenalty = state.currentPenalty + WRONG_TAP_PENALTY_SECONDS;
      // The penalty counts against the rolling average right away: treat the
      // in-progress prompt as if it were completed now.
      const provisional = [...state.times, elapsed + currentPenalty];
      if (isGameOver(provisional)) {
        const bestScore = await recordSpeedGameScore(state.score);
        set({
          status: 'gameOver',
          times: provisional,
          currentPenalty,
          wrongFlash: choice,
          bestScore,
          isNewBest: state.score > state.bestScore,
        });
      } else {
        set({ currentPenalty, wrongFlash: choice });
      }
      return;
    }

    const times = [...state.times, elapsed + state.currentPenalty];
    const score = state.score + 1;

    if (isGameOver(times)) {
      const bestScore = await recordSpeedGameScore(score);
      set({
        status: 'gameOver',
        times,
        score,
        wrongFlash: null,
        bestScore,
        isNewBest: score > state.bestScore,
      });
      return;
    }

    const config: QuizEngineConfig = { mode: state.mode, fretRange: state.fretRange };
    const accidentalDisplay: AccidentalDisplay = state.rng() < 0.5 ? 'sharp' : 'flat';
    const prompt = makeRandomPrompt(config, state.prompt);
    set({
      times,
      score,
      prompt,
      choices: buildChoices(prompt, state.mode, accidentalDisplay, state.rng),
      accidentalDisplay,
      wrongFlash: null,
      currentPenalty: 0,
      promptPresentedAt: state.now(),
    });
  },

  clearWrongFlash: () => set({ wrongFlash: null }),
}));
