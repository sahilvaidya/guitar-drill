import {
  CIRCLE_OF_FIFTHS,
  SCALES,
  THEORY_ROOTS,
  degreeFormula,
  keySignature,
  scaleById,
  signatureLabel,
  spellScale,
  stepPattern,
} from '@/domain/musicTheory';

const major = scaleById('major');

describe('scale spelling', () => {
  it('spells major scales with one letter per degree', () => {
    expect(spellScale('C', major)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(spellScale('F#', major)).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']);
    expect(spellScale('Eb', major)).toEqual(['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D']);
  });

  it('spells the other scales', () => {
    expect(spellScale('A', scaleById('naturalMinor'))).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(spellScale('A', scaleById('harmonicMinor'))).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
    expect(spellScale('A', scaleById('melodicMinor'))).toEqual(['A', 'B', 'C', 'D', 'E', 'F#', 'G#']);
    expect(spellScale('D', scaleById('dorian'))).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
    expect(spellScale('G', scaleById('mixolydian'))).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F']);
    expect(spellScale('A', scaleById('minorPentatonic'))).toEqual(['A', 'C', 'D', 'E', 'G']);
    expect(spellScale('C', scaleById('majorPentatonic'))).toEqual(['C', 'D', 'E', 'G', 'A']);
    expect(spellScale('A', scaleById('blues'))).toEqual(['A', 'C', 'D', 'Eb', 'E', 'G']);
  });

  it('never needs more than double accidentals in any root', () => {
    for (const scale of SCALES) {
      for (const root of THEORY_ROOTS) {
        for (const note of spellScale(root, scale)) {
          expect(note).toMatch(/^[A-G](#{0,2}|b{0,2})$/);
        }
      }
    }
  });

  it('relative minor shares the major scale notes', () => {
    const cMajor = spellScale('C', major);
    const aMinor = spellScale('A', scaleById('naturalMinor'));
    expect([...aMinor].sort()).toEqual([...cMajor].sort());
  });
});

describe('scale formulas', () => {
  it('derives degree formulas relative to major', () => {
    expect(degreeFormula(major).join(' ')).toBe('1 2 3 4 5 6 7');
    expect(degreeFormula(scaleById('naturalMinor')).join(' ')).toBe('1 2 ♭3 4 5 ♭6 ♭7');
    expect(degreeFormula(scaleById('dorian')).join(' ')).toBe('1 2 ♭3 4 5 6 ♭7');
    expect(degreeFormula(scaleById('blues')).join(' ')).toBe('1 ♭3 4 ♭5 5 ♭7');
  });

  it('derives whole/half step patterns', () => {
    expect(stepPattern(major).join(' ')).toBe('W W H W W W H');
    expect(stepPattern(scaleById('naturalMinor')).join(' ')).toBe('W H W W H W W');
    expect(stepPattern(scaleById('harmonicMinor')).join(' ')).toBe('W H W W H W+H H');
    expect(stepPattern(scaleById('minorPentatonic')).join(' ')).toBe('W+H W W W+H W');
  });
});

describe('circle of fifths', () => {
  it('moves up a fifth per step and closes after 12', () => {
    expect(CIRCLE_OF_FIFTHS).toHaveLength(12);
    CIRCLE_OF_FIFTHS.forEach((k, i) => {
      const next = CIRCLE_OF_FIFTHS[(i + 1) % 12];
      expect((next.majorPitchClass - k.majorPitchClass + 12) % 12).toBe(7);
    });
  });

  it('places the relative minor a minor 3rd below each major', () => {
    const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const pcOf = (name: string) =>
      LETTER_PC[name[0]] + (name.includes('#') ? 1 : name.includes('b') ? -1 : 0);
    for (const k of CIRCLE_OF_FIFTHS) {
      expect((((pcOf(k.major) - 3 - pcOf(k.minor)) % 12) + 12) % 12).toBe(0);
    }
  });

  it('key signature counts match the accidentals of the spelled major scale', () => {
    for (const k of CIRCLE_OF_FIFTHS) {
      const notes = spellScale(k.major, major);
      const sharps = notes.filter(n => n.includes('#')).length;
      const flats = notes.filter(n => n.includes('b')).length;
      expect(k.accidentals).toBe(sharps > 0 ? sharps : flats > 0 ? -flats : 0);
    }
  });

  it('lists the signature accidentals in order', () => {
    expect(keySignature(CIRCLE_OF_FIFTHS[2])).toEqual(['F#', 'C#']); // D
    expect(keySignature(CIRCLE_OF_FIFTHS[9])).toEqual(['Bb', 'Eb', 'Ab']); // Eb
    expect(keySignature(CIRCLE_OF_FIFTHS[0])).toEqual([]);
    expect(signatureLabel(CIRCLE_OF_FIFTHS[0])).toBe('no ♯ or ♭');
    expect(signatureLabel(CIRCLE_OF_FIFTHS[11])).toBe('1♭');
  });
});
