import {
  triadNotes,
  TRIAD_INTERVALS,
  TRIAD_QUALITIES,
  TriadQuality,
} from '../../src/domain/triad';

describe('triadNotes', () => {
  test('C major = C E G (pitch class 0)', () => {
    const [r, t, f] = triadNotes(0, 'major');
    expect(r).toBe('C');
    expect(t).toBe('E');
    expect(f).toBe('G');
  });

  test('C minor = C Eb G', () => {
    const [r, t, f] = triadNotes(0, 'minor');
    expect(r).toBe('C');
    expect(t).toBe('D#/Eb');
    expect(f).toBe('G');
  });

  test('C diminished = C Eb Gb', () => {
    const [r, t, f] = triadNotes(0, 'diminished');
    expect(r).toBe('C');
    expect(t).toBe('D#/Eb');
    expect(f).toBe('F#/Gb');
  });

  test('C augmented = C E Ab', () => {
    const [r, t, f] = triadNotes(0, 'augmented');
    expect(r).toBe('C');
    expect(t).toBe('E');
    expect(f).toBe('G#/Ab');
  });

  test('A major = A C# E (pitch class 9)', () => {
    const [r, t, f] = triadNotes(9, 'major');
    expect(r).toBe('A');
    expect(t).toBe('C#/Db');
    expect(f).toBe('E');
  });

  test('G minor = G Bb D (pitch class 7)', () => {
    const [r, t, f] = triadNotes(7, 'minor');
    expect(r).toBe('G');
    expect(t).toBe('A#/Bb');
    expect(f).toBe('D');
  });

  test('wraps correctly for high pitch classes', () => {
    // B major (pitch class 11): B D# F#
    const [r, t, f] = triadNotes(11, 'major');
    expect(r).toBe('B');
    expect(t).toBe('D#/Eb');
    expect(f).toBe('F#/Gb');
  });

  test('all qualities produce exactly 3 distinct notes for C root', () => {
    for (const quality of TRIAD_QUALITIES) {
      const notes = triadNotes(0, quality);
      expect(notes).toHaveLength(3);
      const unique = new Set(notes);
      expect(unique.size).toBe(3);
    }
  });

  test('TRIAD_INTERVALS root offset is always 0', () => {
    for (const quality of TRIAD_QUALITIES) {
      expect(TRIAD_INTERVALS[quality][0]).toBe(0);
    }
  });
});
