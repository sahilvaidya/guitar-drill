import { GUITAR_STRINGS } from '../../src/domain/guitarString';
import { chromaticNoteName, naturalNoteName } from '../../src/domain/fretPosition';
import { normalizeToCanonical, displayChromaticChoices } from '../../src/domain/noteName';

// E string open = E (pitch class 4)
// A string open = A (pitch class 9)

describe('chromaticNoteName', () => {
  test('low E string open', () => {
    const e = GUITAR_STRINGS[0];
    expect(chromaticNoteName({ string: e, fret: 0 })).toBe('E');
  });

  test('low E string fret 1 = F', () => {
    const e = GUITAR_STRINGS[0];
    expect(chromaticNoteName({ string: e, fret: 1 })).toBe('F');
  });

  test('low E string fret 5 = A', () => {
    const e = GUITAR_STRINGS[0];
    expect(chromaticNoteName({ string: e, fret: 5 })).toBe('A');
  });

  test('A string open = A', () => {
    const a = GUITAR_STRINGS[1];
    expect(chromaticNoteName({ string: a, fret: 0 })).toBe('A');
  });

  test('A string fret 2 = B', () => {
    const a = GUITAR_STRINGS[1];
    expect(chromaticNoteName({ string: a, fret: 2 })).toBe('B');
  });

  test('G string fret 2 = A', () => {
    const g = GUITAR_STRINGS[3];
    expect(chromaticNoteName({ string: g, fret: 2 })).toBe('A');
  });

  test('high E string fret 12 = E (octave wrap)', () => {
    const highE = GUITAR_STRINGS[5];
    expect(chromaticNoteName({ string: highE, fret: 12 })).toBe('E');
  });
});

describe('naturalNoteName', () => {
  test('returns null for accidental', () => {
    const e = GUITAR_STRINGS[0];
    // E string fret 1 = F# wait no. E open = E, fret 1 = F, fret 2 = F#/Gb
    expect(naturalNoteName({ string: e, fret: 2 })).toBeNull();
  });

  test('returns note for natural', () => {
    const e = GUITAR_STRINGS[0];
    expect(naturalNoteName({ string: e, fret: 1 })).toBe('F');
  });
});

describe('normalizeToCanonical', () => {
  test('sharp spelling maps to canonical', () => {
    expect(normalizeToCanonical('A#')).toBe('A#/Bb');
    expect(normalizeToCanonical('C#')).toBe('C#/Db');
    expect(normalizeToCanonical('D#')).toBe('D#/Eb');
    expect(normalizeToCanonical('F#')).toBe('F#/Gb');
    expect(normalizeToCanonical('G#')).toBe('G#/Ab');
  });

  test('flat spelling maps to canonical', () => {
    expect(normalizeToCanonical('Bb')).toBe('A#/Bb');
    expect(normalizeToCanonical('Db')).toBe('C#/Db');
    expect(normalizeToCanonical('Eb')).toBe('D#/Eb');
    expect(normalizeToCanonical('Gb')).toBe('F#/Gb');
    expect(normalizeToCanonical('Ab')).toBe('G#/Ab');
  });

  test('natural notes pass through unchanged', () => {
    for (const n of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
      expect(normalizeToCanonical(n)).toBe(n);
    }
  });
});

describe('displayChromaticChoices', () => {
  test('sharp display has 12 notes using sharp spellings', () => {
    const choices = displayChromaticChoices('sharp');
    expect(choices).toHaveLength(12);
    expect(choices).toContain('A#');
    expect(choices).not.toContain('Bb');
    expect(choices).not.toContain('A#/Bb');
  });

  test('flat display has 12 notes using flat spellings', () => {
    const choices = displayChromaticChoices('flat');
    expect(choices).toHaveLength(12);
    expect(choices).toContain('Bb');
    expect(choices).not.toContain('A#');
    expect(choices).not.toContain('A#/Bb');
  });

  test('natural notes appear in both displays', () => {
    for (const display of ['sharp', 'flat'] as const) {
      const choices = displayChromaticChoices(display);
      for (const n of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
        expect(choices).toContain(n);
      }
    }
  });
});
