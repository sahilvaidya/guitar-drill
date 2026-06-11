const storage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(storage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { storage[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete storage[key]; return Promise.resolve(); }),
}));

import { useEarNoteId } from '@/store/useEarNoteId';
import { NoteName, naturalNotes } from '@/domain/noteName';
import { noteNameForMidi } from '@/domain/earNote';
import {
  loadEarNoteLifetimeStats, loadEarNoteSettings, saveEarNoteSettings,
} from '@/services/statsStore';

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(storage).forEach(k => delete storage[k]);
  useEarNoteId.setState({
    prompt: null,
    feedback: null,
    sessionStats: { solvedPrompts: 0, attempts: 0, streak: 0, incorrectThisPrompt: 0 },
    rng: () => 0.42,
  });
});

function state() {
  return useEarNoteId.getState();
}

function wrongAnswer(): NoteName {
  const s = state();
  const correct = noteNameForMidi(s.prompt!.midi);
  return naturalNotes.find(n => n !== correct) ?? 'A';
}

describe('useEarNoteId', () => {
  it('initialize() loads defaults and generates a prompt', async () => {
    await state().initialize();
    const s = state();
    expect(s.prompt).not.toBeNull();
    expect(s.settings).toEqual({ noteSet: 'natural' });
    expect(typeof s.prompt!.midi).toBe('number');
  });

  it('initialize() restores persisted settings', async () => {
    await saveEarNoteSettings({ noteSet: 'chromatic' });
    await state().initialize();
    const s = state();
    expect(s.settings).toEqual({ noteSet: 'chromatic' });
  });

  it('a correct answer sets feedback, bumps streak, and persists the attempt', async () => {
    await state().initialize();
    const correct = noteNameForMidi(state().prompt!.midi);
    await state().submit(correct);
    const s = state();
    expect(s.feedback).toEqual({ answer: correct, isCorrect: true });
    expect(s.sessionStats.attempts).toBe(1);
    expect(s.sessionStats.streak).toBe(1);

    const lifetime = await loadEarNoteLifetimeStats();
    expect(lifetime.totalAnswers).toBe(1);
    expect(lifetime.correctAnswers).toBe(1);
    expect(lifetime.firstTryCorrectAnswers).toBe(1);
    expect(lifetime.solvedPrompts).toBe(1);
    expect(lifetime.bestStreak).toBe(1);
    expect(s.lifetimeStats).toEqual(lifetime);
  });

  it('a wrong answer resets streak and keeps the prompt for retry', async () => {
    await state().initialize();
    await state().submit(noteNameForMidi(state().prompt!.midi));
    state().nextPrompt();

    const prompt = state().prompt;
    await state().submit(wrongAnswer());
    let s = state();
    expect(s.feedback!.isCorrect).toBe(false);
    expect(s.sessionStats.streak).toBe(0);
    expect(s.prompt).toBe(prompt); // same prompt, retry allowed

    // retry succeeds but no longer counts as first-try
    await state().submit(noteNameForMidi(prompt!.midi));
    s = state();
    expect(s.feedback!.isCorrect).toBe(true);
    const lifetime = await loadEarNoteLifetimeStats();
    expect(lifetime.totalAnswers).toBe(3);
    expect(lifetime.correctAnswers).toBe(2);
    expect(lifetime.firstTryCorrectAnswers).toBe(1);
    expect(lifetime.solvedPrompts).toBe(1);
  });

  it('ignores submissions after a correct answer', async () => {
    await state().initialize();
    await state().submit(noteNameForMidi(state().prompt!.midi));
    await state().submit(wrongAnswer());
    const lifetime = await loadEarNoteLifetimeStats();
    expect(lifetime.totalAnswers).toBe(1);
    expect(state().sessionStats.attempts).toBe(1);
  });

  it('nextPrompt() advances, counts the solve, and avoids pitch-class repeats', async () => {
    await state().initialize();
    const first = state().prompt!;
    await state().submit(noteNameForMidi(first.midi));
    state().nextPrompt();
    const s = state();
    expect(s.feedback).toBeNull();
    expect(s.sessionStats.solvedPrompts).toBe(1);
    expect(s.sessionStats.incorrectThisPrompt).toBe(0);
    // next prompt should not repeat the same pitch class
    expect(s.prompt!.midi % 12).not.toBe(first.midi % 12);
  });

  it('incorrectThisPrompt increments on wrong answer and resets on nextPrompt', async () => {
    await state().initialize();
    await state().submit(wrongAnswer());
    expect(state().sessionStats.incorrectThisPrompt).toBe(1);
    await state().submit(noteNameForMidi(state().prompt!.midi));
    state().nextPrompt();
    expect(state().sessionStats.incorrectThisPrompt).toBe(0);
  });

  it('setNoteSet() persists and regenerates the prompt', async () => {
    await state().initialize();
    await state().setNoteSet('chromatic');
    expect(state().settings.noteSet).toBe('chromatic');
    expect(await loadEarNoteSettings()).toEqual({ noteSet: 'chromatic' });
    expect(state().feedback).toBeNull();
  });

  it('best streak survives across sessions', async () => {
    await state().initialize();
    for (let i = 0; i < 3; i++) {
      await state().submit(noteNameForMidi(state().prompt!.midi));
      state().nextPrompt();
    }
    expect((await loadEarNoteLifetimeStats()).bestStreak).toBe(3);

    // a fresh session keeps the lifetime best
    await state().initialize();
    expect(state().lifetimeStats.bestStreak).toBe(3);
    expect(state().sessionStats.streak).toBe(0);
  });
});
