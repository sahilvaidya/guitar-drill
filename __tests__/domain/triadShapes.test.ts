import { TRIAD_SHAPES, TRIAD_STRING_SETS, NoteRole, TriadShape, TriadStringSetId } from '../../src/domain/triadShapes';
import { TRIAD_QUALITIES, TriadQuality } from '../../src/domain/triad';

// Standard tuning open pitch classes, keyed by string name
const OPEN_PITCH_CLASS: Record<string, number> = {
  E: 4, A: 9, D: 2, G: 7, B: 11, e: 4,
};

/**
 * Given a shape, its string set, a root pitch class, and a base fret, compute the
 * pitch class on each string and verify it matches the expected intervals for the quality.
 */
function pitchClassesForShape(
  shape: TriadShape,
  openPitches: [number, number, number],
  baseFret: number,
): [number, number, number] {
  return shape.offsets.map((off, i) =>
    (openPitches[i] + baseFret + off) % 12
  ) as [number, number, number];
}

/** Returns the pitch class of the root given a shape and base fret */
function rootFromShape(shape: TriadShape, openPitches: [number, number, number], baseFret: number): number {
  const pitches = pitchClassesForShape(shape, openPitches, baseFret);
  const rootIdx = shape.roles.indexOf('R' as NoteRole);
  return pitches[rootIdx];
}

const QUALITY_INTERVALS: Record<TriadQuality, Record<NoteRole, number>> = {
  major:      { R: 0, M3: 4, P5: 7,  m3: -1, d5: -1, A5: -1 },
  minor:      { R: 0, m3: 3, P5: 7,  M3: -1, d5: -1, A5: -1 },
  diminished: { R: 0, m3: 3, d5: 6,  M3: -1, P5: -1, A5: -1 },
  augmented:  { R: 0, M3: 4, A5: 8,  m3: -1, P5: -1, d5: -1 },
};

describe('TRIAD_STRING_SETS', () => {
  test('has 4 adjacent string sets', () => {
    expect(TRIAD_STRING_SETS).toHaveLength(4);
  });

  test('each set has 3 distinct string names', () => {
    for (const set of TRIAD_STRING_SETS) {
      expect(set.strings).toHaveLength(3);
      expect(new Set(set.strings).size).toBe(3);
    }
  });
});

describe('TRIAD_SHAPES data integrity', () => {
  for (const set of TRIAD_STRING_SETS) {
    describe(`string set ${set.id} (${set.label})`, () => {
      const openPitches = set.strings.map(s => OPEN_PITCH_CLASS[s]) as [number, number, number];

      for (const quality of TRIAD_QUALITIES) {
        describe(`${quality}`, () => {
          const shapes = TRIAD_SHAPES[set.id][quality];

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

              test('span fits within a reasonable stretch (5 frets)', () => {
                const span = Math.max(...shape.offsets) - Math.min(...shape.offsets);
                expect(span).toBeLessThanOrEqual(4);
              });

              test('contains exactly one root (R)', () => {
                expect(shape.roles.filter(r => r === 'R')).toHaveLength(1);
              });

              test('interval relationships are correct for quality (verified at base fret 5)', () => {
                const baseFret = 5;
                const pitches = pitchClassesForShape(shape, openPitches, baseFret);
                const root = rootFromShape(shape, openPitches, baseFret);
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
  }
});

describe('strings345 and strings456 share identical shapes', () => {
  // Both string pairs (A-D-G and E-A-D) are tuned a perfect fourth apart,
  // so the moveable fret offsets/roles are identical — only string names differ.
  test('offsets and roles match for every quality/inversion', () => {
    for (const quality of TRIAD_QUALITIES) {
      expect(TRIAD_SHAPES.strings345[quality]).toEqual(TRIAD_SHAPES.strings456[quality]);
    }
  });
});

// Spot-check specific well-known shapes on the original G-B-e string set

describe('spot checks — known fret positions (strings123 / G·B·e)', () => {
  const openPitches: [number, number, number] = [7, 11, 4]; // G, B, e

  test('C major root position: G=5, B=5, e=3', () => {
    const shape = TRIAD_SHAPES.strings123.major[0]; // root pos
    // base fret = 3 (e string at offset 0 = fret 3)
    const baseFret = 3;
    const [g, b, e] = pitchClassesForShape(shape, openPitches, baseFret);
    expect(g).toBe(0); // C
    expect(b).toBe(4); // E (major 3rd)
    expect(e).toBe(7); // G (perfect 5th)
  });

  test('C major 1st inversion: G=9, B=8, e=8', () => {
    const shape = TRIAD_SHAPES.strings123.major[1];
    const baseFret = 8;
    const [g, b, e] = pitchClassesForShape(shape, openPitches, baseFret);
    expect(g).toBe(4); // E (major 3rd)
    expect(b).toBe(7); // G (perfect 5th)
    expect(e).toBe(0); // C (root)
  });

  test('C major 2nd inversion: G=0(open), B=1, e=0(open)', () => {
    const shape = TRIAD_SHAPES.strings123.major[2];
    const baseFret = 0;
    const [g, b, e] = pitchClassesForShape(shape, openPitches, baseFret);
    expect(g).toBe(7); // G (perfect 5th)
    expect(b).toBe(0); // C (root)
    expect(e).toBe(4); // E (major 3rd)
  });

  test('C minor root position: G=5, B=4, e=3', () => {
    const shape = TRIAD_SHAPES.strings123.minor[0];
    const baseFret = 3;
    const [g, b, e] = pitchClassesForShape(shape, openPitches, baseFret);
    expect(g).toBe(0); // C
    expect(b).toBe(3); // Eb (minor 3rd)
    expect(e).toBe(7); // G (perfect 5th)
  });

  test('C minor 1st inversion barre: all at fret 8', () => {
    const shape = TRIAD_SHAPES.strings123.minor[1];
    expect(shape.offsets).toEqual([0, 0, 0]); // barre
    const baseFret = 8;
    const [g, b, e] = pitchClassesForShape(shape, openPitches, baseFret);
    expect(g).toBe(3); // Eb (minor 3rd)
    expect(b).toBe(7); // G (perfect 5th)
    expect(e).toBe(0); // C (root)
  });

  test('C diminished root position: G=5, B=4, e=2', () => {
    const shape = TRIAD_SHAPES.strings123.diminished[0];
    const baseFret = 2;
    const [g, b, e] = pitchClassesForShape(shape, openPitches, baseFret);
    expect(g).toBe(0); // C
    expect(b).toBe(3); // Eb (minor 3rd)
    expect(e).toBe(6); // Gb (diminished 5th)
  });

  test('C augmented root position: G=5, B=5, e=4', () => {
    const shape = TRIAD_SHAPES.strings123.augmented[0];
    const baseFret = 4;
    const [g, b, e] = pitchClassesForShape(shape, openPitches, baseFret);
    expect(g).toBe(0); // C
    expect(b).toBe(4); // E (major 3rd)
    expect(e).toBe(8); // Ab (augmented 5th)
  });

  test('augmented — all 3 inversions share the same dot pattern', () => {
    const [s1, s2, s3] = TRIAD_SHAPES.strings123.augmented;
    expect(s1.offsets).toEqual(s2.offsets);
    expect(s2.offsets).toEqual(s3.offsets);
  });
});

// Spot-check a lower string set to sanity-check the derivation

describe('spot checks — known fret positions (strings456 / E·A·D)', () => {
  const openPitches: [number, number, number] = [4, 9, 2]; // E, A, D

  test('C major root position: E=8, A=7, D=5', () => {
    const shape = TRIAD_SHAPES.strings456.major[0];
    const baseFret = 5;
    const [low, mid, high] = pitchClassesForShape(shape, openPitches, baseFret);
    expect(low).toBe(0);  // C (root, low E string)
    expect(mid).toBe(4);  // E (major 3rd, A string)
    expect(high).toBe(7); // G (perfect 5th, D string)
  });

  test('C minor root position: E=8, A=6, D=5', () => {
    const shape = TRIAD_SHAPES.strings456.minor[0];
    const baseFret = 5;
    const [low, mid, high] = pitchClassesForShape(shape, openPitches, baseFret);
    expect(low).toBe(0);  // C (root)
    expect(mid).toBe(3);  // Eb (minor 3rd)
    expect(high).toBe(7); // G (perfect 5th)
  });
});
