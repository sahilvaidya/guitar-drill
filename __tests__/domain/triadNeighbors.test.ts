import {
  NEAREST_TRIAD_SHAPES, placeDiatonicTriads, baseFretForRoot, TOP_SET_OPEN_PITCH_CLASSES,
} from '@/domain/triadNeighbors';
import { TRIAD_SHAPES } from '@/domain/triadShapes';
import { TRIAD_INTERVALS } from '@/domain/triad';
import { diatonicChord, KeyQuality } from '@/domain/chordNumberPractice';

const OFFSETS: Record<KeyQuality, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};
const shapes = TRIAD_SHAPES.strings123;
const center = (offsets: number[], base: number) => base + Math.max(...offsets) / 2;

function soundedPitchClasses(offsets: number[], base: number) {
  return offsets.map((o, i) => (TOP_SET_OPEN_PITCH_CLASSES[i] + base + o) % 12);
}

describe('NEAREST_TRIAD_SHAPES', () => {
  test('has 7 degrees for each key quality and tonic inversion', () => {
    for (const kq of ['major', 'minor'] as const) {
      expect(NEAREST_TRIAD_SHAPES[kq]).toHaveLength(3);
      NEAREST_TRIAD_SHAPES[kq].forEach(row => expect(row).toHaveLength(7));
    }
  });

  test('degree 1 maps to the starting shape itself', () => {
    for (const kq of ['major', 'minor'] as const) {
      NEAREST_TRIAD_SHAPES[kq].forEach((row, inv) => {
        expect(row[0]).toEqual({ quality: kq, inversion: inv, fretDelta: 0 });
      });
    }
  });

  test('each mapped shape has the diatonic quality of its degree', () => {
    const qualities = {
      major: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
      minor: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'],
    };
    for (const kq of ['major', 'minor'] as const) {
      for (const row of NEAREST_TRIAD_SHAPES[kq]) {
        row.forEach((n, d) => expect(n.quality).toBe(qualities[kq][d]));
      }
    }
  });

  test('every entry sounds the right notes and is the nearest voicing', () => {
    for (const kq of ['major', 'minor'] as const) {
      for (let inv = 0; inv < 3; inv++) {
        const start = shapes[kq][inv];
        const tonicBase = baseFretForRoot(start, 0);
        const c0 = center(start.offsets, tonicBase);

        NEAREST_TRIAD_SHAPES[kq][inv].forEach((n, d) => {
          const rootPc = OFFSETS[kq][d];
          const shape = shapes[n.quality][n.inversion];
          const base = tonicBase + n.fretDelta;

          // Notes: exactly the chord's pitch classes
          const expected = TRIAD_INTERVALS[n.quality].map(i => (rootPc + i) % 12).sort();
          expect(soundedPitchClasses(shape.offsets, base).sort()).toEqual(expected);

          // Nearest: no other voicing of that chord (in any octave) is closer
          const dist = Math.abs(center(shape.offsets, base) - c0);
          shapes[n.quality].forEach(other => {
            for (const shift of [-12, 0, 12]) {
              const ob = baseFretForRoot(other, rootPc) + shift;
              expect(Math.abs(center(other.offsets, ob) - c0)).toBeGreaterThanOrEqual(dist);
            }
          });
        });
      }
    }
  });

  test('spot check: C minor as 8-8-8 barre (1st inv)', () => {
    // VI (Ab) is the 2nd-inversion major shape at frets 8-9-8, same base fret
    expect(NEAREST_TRIAD_SHAPES.minor[1][5]).toEqual({ quality: 'major', inversion: 2, fretDelta: 0 });
    // iv (Fm) is the root-position minor shape at 10-9-8
    expect(NEAREST_TRIAD_SHAPES.minor[1][3]).toEqual({ quality: 'minor', inversion: 0, fretDelta: 0 });
  });
});

describe('placeDiatonicTriads', () => {
  test('returns 7 placed triads with chord symbols for the key', () => {
    const placed = placeDiatonicTriads(0, 'major', 0);
    expect(placed.map(p => p.symbol)).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
  });

  test('every placement plays its chord at non-negative frets, all 24 keys', () => {
    for (const kq of ['major', 'minor'] as const) {
      for (let pc = 0; pc < 12; pc++) {
        for (let inv = 0; inv < 3; inv++) {
          const placed = placeDiatonicTriads(pc, kq, inv);
          placed.forEach((p, d) => {
            expect(p.baseFret).toBeGreaterThanOrEqual(0);
            const rootPc = (pc + OFFSETS[kq][d]) % 12;
            const expected = TRIAD_INTERVALS[p.quality].map(i => (rootPc + i) % 12).sort();
            expect(soundedPitchClasses(p.shape.offsets, p.baseFret).sort()).toEqual(expected);
            expect(diatonicChord(pc, kq, d + 1).symbol).toBe(p.symbol);
          });
        }
      }
    }
  });

  test('C major from root position starts on C at frets 5-5-3', () => {
    const placed = placeDiatonicTriads(0, 'major', 0);
    const frets = (i: number) => placed[i].shape.offsets.map(o => o + placed[i].baseFret);
    expect(frets(0)).toEqual([5, 5, 3]);
  });
});
