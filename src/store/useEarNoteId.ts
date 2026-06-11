import { create } from 'zustand';
import {
  EarNotePrompt, EarNoteSet, EarNoteConfig, generateEarNotePrompt,
  noteNameForMidi,
} from '@/domain/earNote';
import { NoteName } from '@/domain/noteName';
import {
  EarNoteLifetimeStats, EMPTY_EAR_NOTE_LIFETIME_STATS,
  EarNoteSettings, DEFAULT_EAR_NOTE_SETTINGS,
  loadEarNoteLifetimeStats, loadEarNoteSettings,
  recordEarNoteAttempt, saveEarNoteSettings,
} from '@/services/statsStore';

export type EarNoteFeedback = { answer: NoteName; isCorrect: boolean };

interface EarNoteSessionStats {
  solvedPrompts: number;
  attempts: number;
  streak: number;
  incorrectThisPrompt: number;
}

interface EarNoteIdState {
  prompt: EarNotePrompt | null;
  feedback: EarNoteFeedback | null;
  sessionStats: EarNoteSessionStats;
  lifetimeStats: EarNoteLifetimeStats;
  settings: EarNoteSettings;
  // injectable for tests
  rng: () => number;
}

interface EarNoteIdActions {
  initialize: () => Promise<void>;
  submit: (answer: NoteName) => Promise<void>;
  nextPrompt: () => void;
  setNoteSet: (noteSet: EarNoteSet) => Promise<void>;
}

const initialSessionStats: EarNoteSessionStats = {
  solvedPrompts: 0,
  attempts: 0,
  streak: 0,
  incorrectThisPrompt: 0,
};

export const useEarNoteId = create<EarNoteIdState & EarNoteIdActions>(
  (set, get) => ({
    prompt: null,
    feedback: null,
    sessionStats: initialSessionStats,
    lifetimeStats: EMPTY_EAR_NOTE_LIFETIME_STATS,
    settings: DEFAULT_EAR_NOTE_SETTINGS,
    rng: Math.random,

    initialize: async () => {
      const [lifetimeStats, settings] = await Promise.all([
        loadEarNoteLifetimeStats(),
        loadEarNoteSettings(),
      ]);
      const config: EarNoteConfig = { noteSet: settings.noteSet };
      const prompt = generateEarNotePrompt(config, get().rng);
      set({
        lifetimeStats,
        settings,
        prompt,
        feedback: null,
        sessionStats: initialSessionStats,
      });
    },

    submit: async (answer: NoteName) => {
      const state = get();
      if (!state.prompt || state.feedback?.isCorrect) return;

      const correct = answer === noteNameForMidi(state.prompt.midi);
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

      await recordEarNoteAttempt({
        correct,
        currentStreak: newStreak,
        isFirstTry,
        isSolvedPrompt: correct && isFirstTry,
      });
      const lifetimeStats = await loadEarNoteLifetimeStats();
      set({ lifetimeStats });
    },

    nextPrompt: () => {
      const state = get();
      const config: EarNoteConfig = { noteSet: state.settings.noteSet };
      const next = generateEarNotePrompt(config, state.rng, state.prompt ?? undefined);
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

    setNoteSet: async (noteSet: EarNoteSet) => {
      const settings: EarNoteSettings = { noteSet };
      await saveEarNoteSettings(settings);
      const config: EarNoteConfig = { noteSet };
      const prompt = generateEarNotePrompt(config, get().rng);
      set(s => ({
        settings,
        prompt,
        feedback: null,
        sessionStats: { ...s.sessionStats, incorrectThisPrompt: 0 },
      }));
    },
  })
);
