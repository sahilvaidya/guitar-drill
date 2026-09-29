import { ALL_INTERVALS, INTERVAL_SEMITONES } from '@/domain/earInterval';
import { INTERVAL_SHAPES, describeShape, noteAbove } from '@/domain/intervalStudy';
import {
  bluesNote,
  pentatonicNotes,
  relativeLabel,
  rootFretOnString,
} from '@/domain/pentatonic';
import { GUITAR_STRINGS } from '@/domain/guitarString';

describe('interval shapes', () => {
  it.each(ALL_INTERVALS)('%s shape spans the right number of semitones', interval => {
    const { stringsUp, fretDelta } = INTERVAL_SHAPES[interval];
    // On E·A·D·G each adjacent string is 5 semitones higher.
    for (let lower = 0; lower + stringsUp <= 3; lower++) {
      const a = GUITAR_STRINGS[lower].openPitchClass + 5;
      const b = GUITAR_STRINGS[lower + stringsUp].openPitchClass + 5 + fretDelta;
      expect((((b - a) % 12) + 12) % 12).toBe(INTERVAL_SEMITONES[interval] % 12);
    }
  });

  it('describes shapes in words', () => {
    expect(describeShape('M2')).toBe('Same string, 2 frets higher');
    expect(describeShape('M3')).toBe('One string up, 1 fret lower');
    expect(describeShape('P4')).toBe('One string up, same fret');
  });

  it('spells intervals above C', () => {
    expect(ALL_INTERVALS.map(i => noteAbove('C', i))).toEqual([
      'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C',
    ]);
  });
});

describe('pentatonic', () => {
  it('spells common pentatonics', () => {
    expect(pentatonicNotes(0, 'major')).toEqual(['C', 'D', 'E', 'G', 'A']);
    expect(pentatonicNotes(9, 'minor')).toEqual(['A', 'C', 'D', 'E', 'G']);
    expect(pentatonicNotes(10, 'major')).toEqual(['Bb', 'C', 'D', 'F', 'G']);
  });

  it('relative keys share the same notes', () => {
    expect(relativeLabel(0, 'major')).toBe('A minor');
    expect(relativeLabel(9, 'minor')).toBe('C major');
    expect([...pentatonicNotes(0, 'major')].sort()).toEqual(
      [...pentatonicNotes(9, 'minor')].sort(),
    );
  });

  it('finds the blues note', () => {
    expect(bluesNote(9)).toBe('D#');
    expect(bluesNote(5)).toBe('B');
  });

  it('locates roots on the low E and A strings', () => {
    expect(rootFretOnString(0, 9)).toBe(5);
    expect(rootFretOnString(1, 9)).toBe(0);
  });
});
