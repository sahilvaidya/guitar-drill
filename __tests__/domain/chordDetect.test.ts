import {
  detectChords,
  detectFromPositions,
  chordSymbol,
  pitchDisplayName,
  absolutePitch,
  ChordMatch,
} from '@/domain/chordDetect';
import { GUITAR_STRINGS } from '@/domain/guitarString';
import { FretPosition } from '@/domain/fretPosition';

// Pitch classes: C=0 C#=1 D=2 Eb=3 E=4 F=5 F#=6 G=7 Ab=8 A=9 Bb=10 B=11

function pos(stringIndex: number, fret: number): FretPosition {
  return { string: GUITAR_STRINGS[stringIndex], fret };
}

function best(pcs: number[], bass: number): ChordMatch {
  const matches = detectChords(pcs, bass);
  expect(matches.length).toBeGreaterThan(0);
  return matches[0];
}

describe('detectChords', () => {
  it('requires at least 3 distinct pitch classes', () => {
    expect(detectChords([], 0)).toEqual([]);
    expect(detectChords([0], 0)).toEqual([]);
    expect(detectChords([0, 7], 0)).toEqual([]);
    expect(detectChords([0, 0, 7, 7], 0)).toEqual([]); // doubled notes don't count
  });

  it('detects all essential triad qualities', () => {
    expect(chordSymbol(best([0, 4, 7], 0))).toBe('C');       // major
    expect(chordSymbol(best([9, 0, 4], 9))).toBe('Am');      // minor
    expect(chordSymbol(best([11, 2, 5], 11))).toBe('Bdim');  // diminished
    expect(chordSymbol(best([2, 4, 9], 2))).toBe('Dsus2');   // sus2
    expect(chordSymbol(best([2, 7, 9], 2))).toBe('Dsus4');   // sus4
  });

  it('detects all essential seventh qualities', () => {
    expect(chordSymbol(best([7, 11, 2, 5], 7))).toBe('G7');      // dominant 7th
    expect(chordSymbol(best([0, 4, 7, 11], 0))).toBe('Cmaj7');   // major 7th
    expect(chordSymbol(best([9, 0, 4, 7], 9))).toBe('Am7');      // minor 7th
    expect(chordSymbol(best([11, 2, 5, 8], 11))).toBe('Bdim7');  // diminished 7th
  });

  it('ignores octave duplicates', () => {
    expect(chordSymbol(best([0, 4, 7, 12, 16], 0))).toBe('C');
  });

  it('recognizes shell voicings of seventh chords (no 5th)', () => {
    const m = best([7, 11, 5], 7); // G B F
    expect(chordSymbol(m)).toBe('G7');
    expect(m.omittedFifth).toBe(true);

    expect(chordSymbol(best([0, 4, 11], 0))).toBe('Cmaj7');
    expect(chordSymbol(best([9, 0, 7], 9))).toBe('Am7');
  });

  it('prefers complete voicings over shell readings', () => {
    // C E G B is a full Cmaj7, even though C E B alone would also match
    const m = best([0, 4, 7, 11], 0);
    expect(m.omittedFifth).toBe(false);
  });

  it('names slash chords from the bass note', () => {
    expect(chordSymbol(best([0, 4, 7], 4))).toBe('C/E');   // 1st inversion
    expect(chordSymbol(best([0, 4, 7], 7))).toBe('C/G');   // 2nd inversion
    expect(chordSymbol(best([9, 0, 4], 0))).toBe('Am/C');
    expect(chordSymbol(best([2, 6, 9], 6))).toBe('D/F#');
  });

  it('resolves sus ambiguity by the bass note', () => {
    // C D G is Csus2 and Gsus4 — the bass decides the primary reading
    const fromC = detectChords([0, 2, 7], 0);
    expect(chordSymbol(fromC[0])).toBe('Csus2');
    expect(fromC.map(m => m.rootPc)).toContain(7); // Gsus4 offered as alternate

    const fromG = detectChords([0, 2, 7], 7);
    expect(chordSymbol(fromG[0])).toBe('Gsus4');
  });

  it('roots a symmetric dim7 on the bass note', () => {
    // C Eb F# A: every note is a valid dim7 root
    const matches = detectChords([0, 3, 6, 9], 6);
    expect(chordSymbol(matches[0])).toBe('F#dim7');
    expect(matches).toHaveLength(4);
  });

  it('returns no match for non-chords', () => {
    expect(detectChords([0, 1, 2], 0)).toEqual([]);          // chromatic cluster
    expect(detectChords([0, 4, 7, 10, 2], 0)).toEqual([]);   // 9th — beyond scope
  });

  it('uses conventional accidental spellings', () => {
    expect(pitchDisplayName(1)).toBe('C#');
    expect(pitchDisplayName(3)).toBe('Eb');
    expect(pitchDisplayName(6)).toBe('F#');
    expect(pitchDisplayName(8)).toBe('Ab');
    expect(pitchDisplayName(10)).toBe('Bb');
    expect(chordSymbol(best([10, 2, 5], 10))).toBe('Bb');
    expect(chordSymbol(best([6, 10, 1], 6))).toBe('F#');
  });
});

describe('detectFromPositions', () => {
  it('returns empty for no positions', () => {
    expect(detectFromPositions([])).toEqual([]);
  });

  it('identifies the open C major shape (x32010)', () => {
    const matches = detectFromPositions([
      pos(1, 3), // C
      pos(2, 2), // E
      pos(3, 0), // G
      pos(4, 1), // C
      pos(5, 0), // E
    ]);
    expect(chordSymbol(matches[0])).toBe('C');
  });

  it('identifies the open G7 shape (320001)', () => {
    const matches = detectFromPositions([
      pos(0, 3), // G
      pos(1, 2), // B
      pos(2, 0), // D
      pos(3, 0), // G
      pos(4, 0), // B
      pos(5, 1), // F
    ]);
    expect(chordSymbol(matches[0])).toBe('G7');
  });

  it('identifies the open Em7 shape (020000)', () => {
    const matches = detectFromPositions([
      pos(0, 0), // E
      pos(1, 2), // B
      pos(2, 0), // D
      pos(3, 0), // G
      pos(4, 0), // B
      pos(5, 0), // E
    ]);
    expect(chordSymbol(matches[0])).toBe('Em7');
  });

  it('uses the lowest sounding note as the bass (D/F#, 2x0232)', () => {
    const matches = detectFromPositions([
      pos(0, 2), // F# — lowest pitch
      pos(2, 0), // D
      pos(3, 2), // A
      pos(4, 3), // D
      pos(5, 2), // F#
    ]);
    expect(chordSymbol(matches[0])).toBe('D/F#');
  });

  it('picks the bass by pitch, not by string index', () => {
    // The open A string (A2) sounds below the low E string at fret 8 (C3)
    expect(absolutePitch(pos(1, 0))).toBeLessThan(absolutePitch(pos(0, 8)));
    const matches = detectFromPositions([
      pos(0, 8), // C — lowest string index, but not the lowest pitch
      pos(1, 0), // A — the true bass
      pos(2, 2), // E
    ]);
    expect(chordSymbol(matches[0])).toBe('Am');
  });
});
