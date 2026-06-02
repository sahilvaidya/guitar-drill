import { GUITAR_STRINGS } from '../../src/domain/guitarString';
import { chromaticNoteName, naturalNoteName } from '../../src/domain/fretPosition';

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
