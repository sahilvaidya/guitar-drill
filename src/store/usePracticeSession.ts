import { create } from 'zustand';
import { QuizPrompt } from '@/domain/quizPrompt';
import { NoteName } from '@/domain/noteName';
import { NotePracticeMode, DEFAULT_PRACTICE_MODE, answerChoices } from '@/domain/notePracticeMode';
import { FretRange, DEFAULT_FRET_RANGE } from '@/domain/fretRange';
import { makeRandomPrompt, evaluate, QuizEngineConfig } from '@/services/quizEngine';
import {
  LifetimeStats,
  EMPTY_LIFETIME_STATS,
  PromptTimingStats,
  RecentMiss,
  loadLifetimeStats,
  loadPracticeMode,
  loadFretRange,
  loadRecentMisses,
  loadTimingStats,
  recordAttempt,
  recordMiss,
  recordCorrectAnswerDuration,
  savePracticeMode,
  saveFretRange,
} from '@/services/statsStore';

export type Feedback = { answer: NoteName; isCorrect: boolean };

interface SessionStats {
  solvedPrompts: number;
  attempts: number;
  streak: number;
  incorrectThisPrompt: number;
}

interface PracticeSessionState {
  // session state
  prompt: QuizPrompt | null;
  feedback: Feedback | null;
  sessionStats: SessionStats;
  // lifetime / persisted
  lifetimeStats: LifetimeStats;
  mode: NotePracticeMode;
  fretRange: FretRange;
  timingStats: PromptTimingStats;
  recentMisses: RecentMiss[];
  // timing
  promptPresentedAt: number | null;
  lastCorrectDuration: number | null;
  // injectable for tests
  now: () => number;
}

interface PracticeSessionActions {
  initialize: () => Promise<void>;
  submit: (answer: NoteName) => Promise<void>;
  nextPrompt: () => void;
  setMode: (mode: NotePracticeMode) => Promise<void>;
  setFretRange: (range: FretRange) => Promise<void>;
}

const initialSessionStats: SessionStats = {
  solvedPrompts: 0,
  attempts: 0,
  streak: 0,
  incorrectThisPrompt: 0,
};

function engineConfig(state: Pick<PracticeSessionState, 'mode' | 'fretRange'>): QuizEngineConfig {
  return { mode: state.mode, fretRange: state.fretRange };
}

export const usePracticeSession = create<PracticeSessionState & PracticeSessionActions>(
  (set, get) => ({
    prompt: null,
    feedback: null,
    sessionStats: initialSessionStats,
    lifetimeStats: EMPTY_LIFETIME_STATS,
    mode: DEFAULT_PRACTICE_MODE,
    fretRange: DEFAULT_FRET_RANGE,
    timingStats: { recentDurations: [], averageDuration: null },
    recentMisses: [],
    promptPresentedAt: null,
    lastCorrectDuration: null,
    now: () => Date.now(),

    initialize: async () => {
      const [lifetimeStats, mode, fretRange, recentMisses, timingStats] = await Promise.all([
        loadLifetimeStats(),
        loadPracticeMode(),
        loadFretRange(),
        loadRecentMisses(),
        loadTimingStats(),
      ]);
      const config: QuizEngineConfig = { mode, fretRange };
      const prompt = makeRandomPrompt(config);
      set({
        lifetimeStats,
        mode,
        fretRange,
        recentMisses,
        timingStats,
        prompt,
        promptPresentedAt: Date.now(),
      });
    },

    submit: async (answer: NoteName) => {
      const state = get();
      if (!state.prompt || state.feedback?.isCorrect) return;

      const correct = evaluate(answer, state.prompt);
      const duration = state.promptPresentedAt ? (state.now() - state.promptPresentedAt) / 1000 : null;
      const isFirstTry = state.sessionStats.incorrectThisPrompt === 0;

      const newStreak = correct ? state.sessionStats.streak + 1 : 0;
      const newAttempts = state.sessionStats.attempts + 1;
      const newIncorrectThisPrompt = correct ? state.sessionStats.incorrectThisPrompt : state.sessionStats.incorrectThisPrompt + 1;

      set(s => ({
        feedback: { answer, isCorrect: correct },
        sessionStats: {
          ...s.sessionStats,
          attempts: newAttempts,
          streak: newStreak,
          incorrectThisPrompt: newIncorrectThisPrompt,
        },
        lastCorrectDuration: correct && duration !== null ? duration : null,
      }));

      // persist
      await recordAttempt({
        correct,
        currentStreak: newStreak,
        isFirstTry,
        isSolvedPrompt: correct && isFirstTry,
      });

      if (!correct && state.prompt) {
        const miss: RecentMiss = {
          position: { stringIndex: state.prompt.position.string.index, fret: state.prompt.position.fret },
          correct: state.prompt.correctAnswer,
          selected: answer,
        };
        await recordMiss(miss);
        const misses = await loadRecentMisses();
        set({ recentMisses: misses });
      }

      if (correct && duration !== null) {
        await recordCorrectAnswerDuration(duration);
        const timingStats = await loadTimingStats();
        set({ timingStats });
      }

      const lifetime = await loadLifetimeStats();
      set({ lifetimeStats: lifetime });
    },

    nextPrompt: () => {
      const state = get();
      const config = engineConfig(state);
      const next = makeRandomPrompt(config, state.prompt ?? undefined);
      set(s => ({
        prompt: next,
        feedback: null,
        promptPresentedAt: s.now(),
        lastCorrectDuration: null,
        sessionStats: {
          ...s.sessionStats,
          solvedPrompts: s.feedback?.isCorrect ? s.sessionStats.solvedPrompts + 1 : s.sessionStats.solvedPrompts,
          incorrectThisPrompt: 0,
        },
      }));
    },

    setMode: async (mode: NotePracticeMode) => {
      await savePracticeMode(mode);
      const config = engineConfig({ mode, fretRange: get().fretRange });
      const prompt = makeRandomPrompt(config);
      set({ mode, prompt, feedback: null, promptPresentedAt: get().now() });
    },

    setFretRange: async (range: FretRange) => {
      await saveFretRange(range);
      const config = engineConfig({ mode: get().mode, fretRange: range });
      const prompt = makeRandomPrompt(config);
      set({ fretRange: range, prompt, feedback: null, promptPresentedAt: get().now() });
    },
  })
);

export function useAnswerChoices(): NoteName[] {
  return answerChoices(usePracticeSession(s => s.mode));
}
