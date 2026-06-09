import { distractorCandidates, pickDistractors } from '@/domain/speedGameDistractors';
import { GUITAR_STRINGS } from '@/domain/guitarString';
import { chromaticNoteName, noteNameForMode } from '@/domain/fretPosition';
import { isNatural, NoteName } from '@/domain/noteName';
import { NotePracticeMode } from '@/domain/notePracticeMode';
import { QuizPrompt } from '@/domain/quizPrompt';

function promptAt(stringIndex: number, fret: number, mode: NotePracticeMode): QuizPrompt | null {
  const position = { string: GUITAR_STRINGS[stringIndex], fret };
  const note = noteNameForMode(position, mode);
  if (note === null) return null;
  return { position, correctAnswer: note };
}

function allPrompts(mode: NotePracticeMode): QuizPrompt[] {
  const prompts: QuizPrompt[] = [];
  for (const s of GUITAR_STRINGS) {
    for (let f = 0; f <= 12; f++) {
      const p = promptAt(s.index, f, mode);
      if (p) prompts.push(p);
    }
  }
  return prompts;
}

// Deterministic rng cycling through fixed values
function seededRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe.each(['natural', 'chromatic'] as NotePracticeMode[])(
  'pickDistractors (%s mode)',
  mode => {
    it('always returns 2 distinct wrong notes for every position', () => {
      for (const prompt of allPrompts(mode)) {
        const [d1, d2] = pickDistractors(prompt, mode, seededRng([0.1, 0.7]));
        expect(d1).not.toBe(d2);
        expect(d1).not.toBe(prompt.correctAnswer);
        expect(d2).not.toBe(prompt.correctAnswer);
      }
    });

    it('returns notes from the candidate pool', () => {
      for (const prompt of allPrompts(mode).slice(0, 20)) {
        const pool = distractorCandidates(prompt, mode);
        const [d1, d2] = pickDistractors(prompt, mode, seededRng([0.3, 0.9]));
        expect(pool).toContain(d1);
        expect(pool).toContain(d2);
      }
    });
  },
);

describe('distractorCandidates', () => {
  it('only yields natural notes in natural mode', () => {
    for (const prompt of allPrompts('natural')) {
      for (const note of distractorCandidates(prompt, 'natural')) {
        expect(isNatural(note)).toBe(true);
      }
    }
  });

  it('never includes the correct answer', () => {
    for (const mode of ['natural', 'chromatic'] as NotePracticeMode[]) {
      for (const prompt of allPrompts(mode)) {
        expect(distractorCandidates(prompt, mode)).not.toContain(prompt.correctAnswer);
      }
    }
  });

  it('always has at least 2 candidates for every position', () => {
    for (const mode of ['natural', 'chromatic'] as NotePracticeMode[]) {
      for (const prompt of allPrompts(mode)) {
        expect(distractorCandidates(prompt, mode).length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('includes fretboard neighbours and half-step neighbours', () => {
    // A string, fret 3 = C (chromatic mode)
    const prompt = promptAt(1, 3, 'chromatic')!;
    expect(prompt.correctAnswer).toBe('C');
    const pool = distractorCandidates(prompt, 'chromatic');

    // Half steps around C
    expect(pool).toContain('B');
    expect(pool).toContain('C#/Db');
    // ±2 frets on the same string: A#/Bb (fret 1) and D (fret 5)
    expect(pool).toContain('A#/Bb');
    expect(pool).toContain('D');
    // Adjacent string, same fret: low E fret 3 = G, D string fret 3 = F
    expect(pool).toContain('G');
    expect(pool).toContain('F');
  });

  it('respects fretboard bounds at the nut', () => {
    // Open low E — neighbours below fret 0 must not crash or appear
    const prompt = promptAt(0, 0, 'chromatic')!;
    const pool = distractorCandidates(prompt, 'chromatic');
    expect(pool.length).toBeGreaterThanOrEqual(2);
    expect(pool).not.toContain(prompt.correctAnswer);
  });

  it('candidates correspond to real nearby notes', () => {
    // G string fret 7 = D; nearby pool should include the notes physically
    // around it, e.g. C and E (±2 frets on the same string)
    const prompt = promptAt(3, 7, 'natural')!;
    expect(prompt.correctAnswer).toBe('D');
    const pool = distractorCandidates(prompt, 'natural');
    expect(pool).toContain('C');
    expect(pool).toContain('E');
  });
});
