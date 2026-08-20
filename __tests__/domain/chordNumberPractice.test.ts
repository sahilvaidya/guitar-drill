import {
  diatonicChord,
  diatonicChords,
  keyLabel,
  parseKeyRoot,
  randomChordNumbers,
  generateChordNumberPrompt,
  MIN_CHORDS,
  MAX_CHORDS,
  KeyQuality,
} from '@/domain/chordNumberPractice';

// A deterministic rng that replays a fixed sequence of [0,1) values.
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('parseKeyRoot', () => {
  it('parses naturals, sharps, and flats to pitch classes', () => {
    expect(parseKeyRoot('C').pitchClass).toBe(0);
    expect(parseKeyRoot('F#').pitchClass).toBe(6);
    expect(parseKeyRoot('Eb').pitchClass).toBe(3);
    expect(parseKeyRoot('B').pitchClass).toBe(11);
  });
});

describe('keyLabel', () => {
  it('spells common keys conventionally', () => {
    expect(keyLabel(0, 'major')).toBe('C major');
    expect(keyLabel(7, 'major')).toBe('G major');
    expect(keyLabel(3, 'major')).toBe('Eb major');
    expect(keyLabel(9, 'minor')).toBe('A minor');
    expect(keyLabel(6, 'minor')).toBe('F# minor');
  });
});

describe('diatonicChord — major keys', () => {
  it('C major degrees are the natural triads', () => {
    const symbols = diatonicChords(0, 'major').map(c => c.symbol);
    expect(symbols).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
  });

  it('G major uses F# for the leading-tone chord', () => {
    const chords = diatonicChords(7, 'major');
    expect(chords.map(c => c.symbol)).toEqual([
      'G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim',
    ]);
  });

  it('F major uses Bb for the IV chord', () => {
    const chords = diatonicChords(5, 'major');
    expect(chords.map(c => c.symbol)).toEqual([
      'F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim',
    ]);
  });

  it('Eb major stays within single accidentals', () => {
    const chords = diatonicChords(3, 'major');
    expect(chords.map(c => c.symbol)).toEqual([
      'Eb', 'Fm', 'Gm', 'Ab', 'Bb', 'Cm', 'Ddim',
    ]);
  });

  it('F# major spells the leading tone as E#', () => {
    const seventh = diatonicChord(6, 'major', 7);
    expect(seventh.root).toBe('E#');
    expect(seventh.quality).toBe('diminished');
    expect(seventh.symbol).toBe('E#dim');
  });
});

describe('diatonicChord — minor keys', () => {
  it('A minor degrees are the natural triads', () => {
    const symbols = diatonicChords(9, 'minor').map(c => c.symbol);
    expect(symbols).toEqual(['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']);
  });

  it('C minor uses flats', () => {
    const chords = diatonicChords(0, 'minor');
    expect(chords.map(c => c.symbol)).toEqual([
      'Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb',
    ]);
  });

  it('E minor uses F#', () => {
    const chords = diatonicChords(4, 'minor');
    expect(chords.map(c => c.symbol)).toEqual([
      'Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D',
    ]);
  });
});

describe('diatonicChord — every key spells with single accidentals', () => {
  const qualities: KeyQuality[] = ['major', 'minor'];
  for (let pc = 0; pc < 12; pc++) {
    for (const q of qualities) {
      it(`no double accidentals in ${keyLabel(pc, q)}`, () => {
        const chords = diatonicChords(pc, q);
        expect(chords).toHaveLength(7);
        for (const c of chords) {
          expect(c.root).not.toContain('##');
          expect(c.root).not.toContain('bb');
          // Every degree gets a distinct letter name.
          expect(c.root[0]).toMatch(/[A-G]/);
        }
        // All seven roots use seven different letters.
        const letters = new Set(chords.map(c => c.root[0]));
        expect(letters.size).toBe(7);
      });
    }
  }

  it('rejects out-of-range numbers', () => {
    expect(() => diatonicChord(0, 'major', 0)).toThrow();
    expect(() => diatonicChord(0, 'major', 8)).toThrow();
  });
});

describe('randomChordNumbers', () => {
  it('produces the requested count within 1–7', () => {
    const nums = randomChordNumbers(4, seqRng([0.0, 0.2, 0.5, 0.9]));
    expect(nums).toHaveLength(4);
    for (const n of nums) {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(7);
    }
  });

  it('never repeats the same number consecutively', () => {
    // rng returns a constant, which would map every draw to the same degree.
    const nums = randomChordNumbers(5, () => 0.0);
    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).not.toBe(nums[i - 1]);
    }
  });

  it('handles rng() === 1 without going out of range', () => {
    const nums = randomChordNumbers(3, () => 0.999999);
    for (const n of nums) {
      expect(n).toBeLessThanOrEqual(7);
    }
  });
});

describe('generateChordNumberPrompt', () => {
  it('picks a key, quality, and a 2–5 chord progression', () => {
    const prompt = generateChordNumberPrompt(seqRng([0.0, 0.0, 0.0, 0.3, 0.6]));
    expect(prompt.keyPitchClass).toBeGreaterThanOrEqual(0);
    expect(prompt.keyPitchClass).toBeLessThanOrEqual(11);
    expect(['major', 'minor']).toContain(prompt.keyQuality);
    expect(prompt.numbers.length).toBeGreaterThanOrEqual(MIN_CHORDS);
    expect(prompt.numbers.length).toBeLessThanOrEqual(MAX_CHORDS);
    expect(prompt.keyLabel).toBe(keyLabel(prompt.keyPitchClass, prompt.keyQuality));
  });

  it('stays in range across many random draws', () => {
    for (let i = 0; i < 500; i++) {
      const prompt = generateChordNumberPrompt(Math.random);
      expect(prompt.numbers.length).toBeGreaterThanOrEqual(MIN_CHORDS);
      expect(prompt.numbers.length).toBeLessThanOrEqual(MAX_CHORDS);
      expect(prompt.keyPitchClass).toBeGreaterThanOrEqual(0);
      expect(prompt.keyPitchClass).toBeLessThanOrEqual(11);
      for (const n of prompt.numbers) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(7);
      }
    }
  });
});
