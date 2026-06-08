import { create } from 'zustand';
import { InversePrompt } from '@/domain/inversePrompt';
import { FretPosition, fretPositionId, getAllPositionsForNote } from '@/domain/fretPosition';
import { NoteName } from '@/domain/noteName';
import { AccidentalDisplay } from '@/domain/noteName';
import { NotePracticeMode, DEFAULT_PRACTICE_MODE } from '@/domain/notePracticeMode';
import { FretRange, DEFAULT_FRET_RANGE } from '@/domain/fretRange';
import { QuizEngineConfig, generateInversePrompt } from '@/services/quizEngine';
import {
  InverseLifetimeStats,
  EMPTY_INVERSE_LIFETIME_STATS,
  loadInverseLifetimeStats,
  loadInverseMissedNotes,
  loadPracticeMode,
  loadFretRange,
  recordInverseAttempt,
  recordInverseMiss,
} from '@/services/statsStore';

interface InverseSessionStats {
  solvedPrompts: number;
  attempts: number;
  streak: number;
  incorrectThisPrompt: boolean;
}

interface InversePracticeState {
  prompt: InversePrompt | null;
  revealPositions: FretPosition[];
  wrongTapPosition: FretPosition | null;
  isRevealed: boolean;
  sessionStats: InverseSessionStats;
  lifetimeStats: InverseLifetimeStats;
  mode: NotePracticeMode;
  fretRange: FretRange;
  accidentalDisplay: AccidentalDisplay;
  missedNotes: NoteName[];
}

interface InversePracticeActions {
  initialize: () => Promise<void>;
  tapPosition: (pos: FretPosition) => Promise<void>;
  nextPrompt: () => void;
  clearWrongTap: () => void;
}

const initialSessionStats: InverseSessionStats = {
  solvedPrompts: 0,
  attempts: 0,
  streak: 0,
  incorrectThisPrompt: false,
};

function randomAccidentalDisplay(): AccidentalDisplay {
  return Math.random() < 0.5 ? 'sharp' : 'flat';
}

function engineConfig(state: Pick<InversePracticeState, 'mode' | 'fretRange'>): QuizEngineConfig {
  return { mode: state.mode, fretRange: state.fretRange };
}

export const useInversePracticeSession = create<InversePracticeState & InversePracticeActions>(
  (set, get) => ({
    prompt: null,
    revealPositions: [],
    wrongTapPosition: null,
    isRevealed: false,
    sessionStats: initialSessionStats,
    lifetimeStats: EMPTY_INVERSE_LIFETIME_STATS,
    mode: DEFAULT_PRACTICE_MODE,
    fretRange: DEFAULT_FRET_RANGE,
    accidentalDisplay: 'sharp',
    missedNotes: [],

    initialize: async () => {
      const [lifetimeStats, mode, fretRange, missedNotes] = await Promise.all([
        loadInverseLifetimeStats(),
        loadPracticeMode(),
        loadFretRange(),
        loadInverseMissedNotes(),
      ]);
      const config: QuizEngineConfig = { mode, fretRange };
      const accidentalDisplay = randomAccidentalDisplay();
      const prompt = generateInversePrompt(config, missedNotes, accidentalDisplay);
      set({ lifetimeStats, mode, fretRange, missedNotes, prompt, accidentalDisplay });
    },

    tapPosition: async (pos: FretPosition) => {
      const state = get();
      if (!state.prompt || state.isRevealed) return;

      const isCorrect = state.prompt.validPositions.some(
        p => p.string.index === pos.string.index && p.fret === pos.fret,
      );

      if (isCorrect) {
        const newStreak = state.sessionStats.streak + 1;
        set(s => ({
          isRevealed: true,
          revealPositions: s.prompt!.validPositions,
          wrongTapPosition: null,
          sessionStats: {
            ...s.sessionStats,
            solvedPrompts: s.sessionStats.solvedPrompts + 1,
            attempts: s.sessionStats.attempts + 1,
            streak: newStreak,
          },
        }));
        await recordInverseAttempt({ solved: true, currentStreak: newStreak });
        const lifetimeStats = await loadInverseLifetimeStats();
        set({ lifetimeStats });
      } else {
        const tapId = fretPositionId(pos);
        const alreadyTapped = state.wrongTapPosition
          ? fretPositionId(state.wrongTapPosition) === tapId
          : false;
        if (alreadyTapped) return;

        set(s => ({
          wrongTapPosition: pos,
          sessionStats: {
            ...s.sessionStats,
            attempts: s.sessionStats.attempts + 1,
            streak: 0,
            incorrectThisPrompt: true,
          },
        }));
        await recordInverseAttempt({ solved: false, currentStreak: 0 });
        if (!state.sessionStats.incorrectThisPrompt) {
          await recordInverseMiss(state.prompt.targetNote);
          const missedNotes = await loadInverseMissedNotes();
          set({ missedNotes });
        }
        const lifetimeStats = await loadInverseLifetimeStats();
        set({ lifetimeStats });
      }
    },

    nextPrompt: () => {
      const state = get();
      const config = engineConfig(state);
      const accidentalDisplay = randomAccidentalDisplay();
      const next = generateInversePrompt(
        config,
        state.missedNotes,
        accidentalDisplay,
        state.prompt?.targetNote,
      );
      set({
        prompt: next,
        revealPositions: [],
        wrongTapPosition: null,
        isRevealed: false,
        accidentalDisplay,
        sessionStats: {
          ...state.sessionStats,
          incorrectThisPrompt: false,
        },
      });
    },

    clearWrongTap: () => set({ wrongTapPosition: null }),
  }),
);
