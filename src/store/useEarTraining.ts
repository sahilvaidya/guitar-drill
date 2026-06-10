import { create } from 'zustand';
import {
  EarIntervalPrompt, EarDirectionSetting, EarLevel, IntervalName,
  generateEarIntervalPrompt,
} from '@/domain/earInterval';
import {
  EarLifetimeStats, EMPTY_EAR_LIFETIME_STATS,
  EarTrainingSettings, DEFAULT_EAR_TRAINING_SETTINGS,
  loadEarLifetimeStats, loadEarTrainingSettings,
  recordEarIntervalAttempt, saveEarTrainingSettings,
} from '@/services/statsStore';

export type EarFeedback = { answer: IntervalName; isCorrect: boolean };

interface EarSessionStats {
  solvedPrompts: number;
  attempts: number;
  streak: number;
  incorrectThisPrompt: number;
}

interface EarTrainingState {
  prompt: EarIntervalPrompt | null;
  feedback: EarFeedback | null;
  sessionStats: EarSessionStats;
  lifetimeStats: EarLifetimeStats;
  settings: EarTrainingSettings;
  // injectable for tests
  rng: () => number;
}

interface EarTrainingActions {
  initialize: () => Promise<void>;
  submit: (answer: IntervalName) => Promise<void>;
  nextPrompt: () => void;
  setDirection: (direction: EarDirectionSetting) => Promise<void>;
  setLevel: (level: EarLevel) => Promise<void>;
}

const initialSessionStats: EarSessionStats = {
  solvedPrompts: 0,
  attempts: 0,
  streak: 0,
  incorrectThisPrompt: 0,
};

export const useEarTraining = create<EarTrainingState & EarTrainingActions>(
  (set, get) => ({
    prompt: null,
    feedback: null,
    sessionStats: initialSessionStats,
    lifetimeStats: EMPTY_EAR_LIFETIME_STATS,
    settings: DEFAULT_EAR_TRAINING_SETTINGS,
    rng: Math.random,

    initialize: async () => {
      const [lifetimeStats, settings] = await Promise.all([
        loadEarLifetimeStats(),
        loadEarTrainingSettings(),
      ]);
      const prompt = generateEarIntervalPrompt(settings, get().rng);
      set({
        lifetimeStats,
        settings,
        prompt,
        feedback: null,
        sessionStats: initialSessionStats,
      });
    },

    submit: async (answer: IntervalName) => {
      const state = get();
      if (!state.prompt || state.feedback?.isCorrect) return;

      const correct = answer === state.prompt.interval;
      const isFirstTry = state.sessionStats.incorrectThisPrompt === 0;
      const newStreak = correct ? state.sessionStats.streak + 1 : 0;

      set(s => ({
        feedback: { answer, isCorrect: correct },
        sessionStats: {
          ...s.sessionStats,
          attempts: s.sessionStats.attempts + 1,
          streak: newStreak,
          incorrectThisPrompt: correct
            ? s.sessionStats.incorrectThisPrompt
            : s.sessionStats.incorrectThisPrompt + 1,
        },
      }));

      await recordEarIntervalAttempt({
        correct,
        currentStreak: newStreak,
        isFirstTry,
        isSolvedPrompt: correct && isFirstTry,
      });
      const lifetimeStats = await loadEarLifetimeStats();
      set({ lifetimeStats });
    },

    nextPrompt: () => {
      const state = get();
      const next = generateEarIntervalPrompt(
        state.settings, state.rng, state.prompt ?? undefined,
      );
      set(s => ({
        prompt: next,
        feedback: null,
        sessionStats: {
          ...s.sessionStats,
          solvedPrompts: s.feedback?.isCorrect
            ? s.sessionStats.solvedPrompts + 1
            : s.sessionStats.solvedPrompts,
          incorrectThisPrompt: 0,
        },
      }));
    },

    setDirection: async (direction: EarDirectionSetting) => {
      const settings: EarTrainingSettings = { ...get().settings, direction };
      await saveEarTrainingSettings(settings);
      const prompt = generateEarIntervalPrompt(settings, get().rng);
      set(s => ({
        settings,
        prompt,
        feedback: null,
        sessionStats: { ...s.sessionStats, incorrectThisPrompt: 0 },
      }));
    },

    setLevel: async (level: EarLevel) => {
      const settings: EarTrainingSettings = { ...get().settings, level };
      await saveEarTrainingSettings(settings);
      const prompt = generateEarIntervalPrompt(settings, get().rng);
      set(s => ({
        settings,
        prompt,
        feedback: null,
        sessionStats: { ...s.sessionStats, incorrectThisPrompt: 0 },
      }));
    },
  })
);
