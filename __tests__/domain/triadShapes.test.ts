import { TRIAD_SHAPES, NoteRole, TriadShape } from '../../src/domain/triadShapes';
import { TRIAD_QUALITIES, TriadQuality } from '../../src/domain/triad';

// Standard tuning open pitch classes for the relevant strings
const G_OPEN = 7;
const B_OPEN = 11;
const E_OPEN = 4; // high e

/**
 * Given a shape, a root pitch class, and a base fret, compute the pitch class
 * on each string and verify it matches the expected intervals for the quality.
 *
 * String order in arrays: [0]=G, [1]=B, [2]=e
 */
function pitchClassesForShape(
  shape: TriadShape,
  baseFret: number,
): [number, number, number] {
  const openPitches = [G_OPEN, B_OPEN, E_OPEN];
  return shape.offsets.map((off, i) =>
    (openPitches[i] + baseFret + off) % 12
  ) as [number, number, number];
}

/** Returns the pitch class of the root given a shape and base fret */
function rootFromShape(shape: TriadShape, baseFret: number): number {
  const pitches = pitchClassesForShape(shape, baseFret);
  const rootIdx = shape.roles.indexOf('R' as NoteRole);
  return pitches[rootIdx];
}

const QUALITY_INTERVALS: Record<TriadQuality, Record<NoteRole, number>> = {
  major:      { R: 0, M3: 4, P5: 7,  m3: -1, d5: -1, A5: -1 },
  minor:      { R: 0, m3: 3, P5: 7,  M3: -1, d5: -1, A5: -1 },
  diminished: { R: 0, m3: 3, d5: 6,  M3: -1, P5: -1, A5: -1 },
  augmented:  { R: 0, M3: 4, A5: 8,  m3: -1, P5: -1, d5: -1 },
};

describe('TRIAD_SHAPES data integrity', () => {
  for (const quality of TRIAD_QUALITIES) {
    describe(`${quality}`, () => {
      const shapes = TRIAD_SHAPES[quality];

      test('has exactly 3 shapes', () => {
        expect(shapes).toHaveLength(3);
      });

      shapes.forEach((shape, si) => {
        describe(`shape ${si + 1} (${shape.label})`, () => {
          test('offsets array has 3 entries', () => {
            expect(shape.offsets).toHaveLength(3);
          });

          test('roles array has 3 entries', () => {
            expect(shape.roles).toHaveLength(3);
          });

          test('base fret offset is 0 (at least one string at 0)', () => {
            expect(Math.min(...shape.offsets)).toBe(0);
          });

          test('all three roles are distinct', () => {
            const unique = new Set(shape.roles);
            expect(unique.size).toBe(3);
          });

          test('span fits within 4 frets', () => {
            const span = Math.max(...shape.offsets) - Math.min(...shape.offsets);
            expect(span).toBeLessThanOrEqual(3);
          });

          test('contains exactly one root (R)', () => {
            expect(shape.roles.filter(r => r === 'R')).toHaveLength(1);
          });

          test('interval relationships are correct for quality (verified at base fret 5)', () => {
            const baseFret = 5;
            const pitches = pitchClassesForShape(shape, baseFret);
            const root = rootFromShape(shape, baseFret);
            const intervals = QUALITY_INTERVALS[quality];

            shape.roles.forEach((role, i) => {
              const expectedInterval = intervals[role];
              if (expectedInterval === -1) return; // role not used by this quality
              const actualInterval = (pitches[i] - root + 12) % 12;
              expect(actualInterval).toBe(expectedInterval);
            });
          });
        });
      });
    });
  }
});

// Spot-check specific well-known shapes

describe('spot checks — known fret positions', () => {
  test('C major root position: G=5, B=5, e=3', () => {
    const shape = TRIAD_SHAPES.major[0]; // root pos
    // base fret = 3 (e string at offset 0 = fret 3)
    const baseFret = 3;
    const [g, b, e] = pitchClassesForShape(shape, baseFret);
    expect(g).toBe(0); // C
    expect(b).toBe(4); // E (major 3rd)
    expect(e).toBe(7); // G (perfect 5th)
  });

  test('C major 1st inversion: G=9, B=8, e=8', () => {
    const shape = TRIAD_SHAPES.major[1];
    const baseFret = 8;
    const [g, b, e] = pitchClassesForShape(shape, baseFret);
    expect(g).toBe(4); // E (major 3rd)
    expect(b).toBe(7); // G (perfect 5th)
    expect(e).toBe(0); // C (root)
  });

  test('C major 2nd inversion: G=0(open), B=1, e=0(open)', () => {
    const shape = TRIAD_SHAPES.major[2];
    const baseFret = 0;
    const [g, b, e] = pitchClassesForShape(shape, baseFret);
    expect(g).toBe(7); // G (perfect 5th)
    expect(b).toBe(0); // C (root)
    expect(e).toBe(4); // E (major 3rd)
  });

  test('C minor root position: G=5, B=4, e=3', () => {
    const shape = TRIAD_SHAPES.minor[0];
    const baseFret = 3;
    const [g, b, e] = pitchClassesForShape(shape, baseFret);
    expect(g).toBe(0); // C
    expect(b).toBe(3); // Eb (minor 3rd)
    expect(e).toBe(7); // G (perfect 5th)
  });

  test('C minor 1st inversion barre: all at fret 8', () => {
    const shape = TRIAD_SHAPES.minor[1];
    expect(shape.offsets).toEqual([0, 0, 0]); // barre
    const baseFret = 8;
    const [g, b, e] = pitchClassesForShape(shape, baseFret);
    expect(g).toBe(3); // Eb (minor 3rd)
    expect(b).toBe(7); // G (perfect 5th)
    expect(e).toBe(0); // C (root)
  });

  test('C diminished root position: G=5, B=4, e=2', () => {
    const shape = TRIAD_SHAPES.diminished[0];
    const baseFret = 2;
    const [g, b, e] = pitchClassesForShape(shape, baseFret);
    expect(g).toBe(0); // C
    expect(b).toBe(3); // Eb (minor 3rd)
    expect(e).toBe(6); // Gb (diminished 5th)
  });

  test('C augmented root position: G=5, B=5, e=4', () => {
    const shape = TRIAD_SHAPES.augmented[0];
    const baseFret = 4;
    const [g, b, e] = pitchClassesForShape(shape, baseFret);
    expect(g).toBe(0); // C
    expect(b).toBe(4); // E (major 3rd)
    expect(e).toBe(8); // Ab (augmented 5th)
  });

  test('augmented — all 3 inversions share the same dot pattern', () => {
    const [s1, s2, s3] = TRIAD_SHAPES.augmented;
    expect(s1.offsets).toEqual(s2.offsets);
    expect(s2.offsets).toEqual(s3.offsets);
  });
});
