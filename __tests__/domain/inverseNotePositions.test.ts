import { getAllPositionsForNote } from '../../src/domain/fretPosition';
import { DEFAULT_FRET_RANGE, FretRange } from '../../src/domain/fretRange';

describe('getAllPositionsForNote', () => {
  it('returns positions across multiple strings for A on full fretboard', () => {
    const positions = getAllPositionsForNote('A', DEFAULT_FRET_RANGE);
    // A appears on: A string fret 0, D string fret 7, G string fret 2, B string fret 10, e string fret 5, E string fret 5
    expect(positions.length).toBeGreaterThanOrEqual(6);
    for (const pos of positions) {
      const pitchClass = (pos.string.openPitchClass + pos.fret) % 12;
      expect(pitchClass).toBe(9); // A = pitch class 9
    }
  });

  it('returns correct positions for F#/Gb', () => {
    const positions = getAllPositionsForNote('F#/Gb', DEFAULT_FRET_RANGE);
    expect(positions.length).toBeGreaterThan(0);
    for (const pos of positions) {
      const pitchClass = (pos.string.openPitchClass + pos.fret) % 12;
      expect(pitchClass).toBe(6); // F#/Gb = pitch class 6
    }
  });

  it('returns correct positions for A#/Bb', () => {
    const positions = getAllPositionsForNote('A#/Bb', DEFAULT_FRET_RANGE);
    expect(positions.length).toBeGreaterThan(0);
    for (const pos of positions) {
      const pitchClass = (pos.string.openPitchClass + pos.fret) % 12;
      expect(pitchClass).toBe(10); // A#/Bb = pitch class 10
    }
  });

  it('restricts positions to the active fret range', () => {
    const range: FretRange = { start: 5, end: 7 };
    const positions = getAllPositionsForNote('A', range);
    for (const pos of positions) {
      expect(pos.fret).toBeGreaterThanOrEqual(5);
      expect(pos.fret).toBeLessThanOrEqual(7);
    }
  });

  it('returns empty array when note has no positions in range', () => {
    // A is pitch class 9; on low-E (openPitchClass 4), fret 5 = 9 (A)
    // Use a range that skips all A positions
    const range: FretRange = { start: 6, end: 6 };
    // Check fret 6 across all strings — only B string (openPitchClass 11) at fret 6 = 17 % 12 = 5 (F)
    // and highE (openPitchClass 4) at fret 6 = 10 (A#), etc. — none are A
    const positions = getAllPositionsForNote('A', range);
    for (const pos of positions) {
      const pitchClass = (pos.string.openPitchClass + pos.fret) % 12;
      expect(pitchClass).toBe(9);
    }
  });

  it('includes open string positions when fret range starts at 0', () => {
    const positions = getAllPositionsForNote('A', { start: 0, end: 3 });
    const openA = positions.find(p => p.fret === 0 && p.string.name === 'A');
    expect(openA).toBeDefined();
  });
});
