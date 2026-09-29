// Nearest-triad-shape mapping for chord-number practice. Pure TS, no RN deps.
//
// On the top string set (G·B·e) a chord can be played as a root-position,
// 1st-inversion or 2nd-inversion closed triad, so every diatonic chord has
// three candidate voicings up and down the neck. Rather than jumping around,
// a player wants the voicing of each chord that sits closest to the shape
// they're already in. This table stores that as a static, *relative* mapping:
//
//   NEAREST_TRIAD_SHAPES[keyQuality][tonicInversion][degree - 1]
//     -> which voicing (quality + inversion) of that degree's chord is
//        nearest to the tonic voicing, and how many frets above (+) or below
//        (-) the tonic shape's base fret it sits.
//
// It is key-independent: the tonic shape's base fret comes from the key, and
// the other chords' base frets are that base plus `fretDelta`. "Nearest" means
// the smallest distance between the centres of the two shapes' fret spans
// (ties go to the lower inversion). `__tests__/domain/triadNeighbors.test.ts`
// re-derives every entry from the shape table and pitch-class arithmetic.

import { KeyQuality, diatonicChord } from './chordNumberPractice';
import { TRIAD_SHAPES, TriadShape } from './triadShapes';
import { TriadQuality } from './triad';

export interface NearestShape {
  quality: TriadQuality;
  /** Index into TRIAD_SHAPES.strings123[quality]: 0 root pos, 1 = 1st inv, 2 = 2nd inv */
  inversion: number;
  /** Frets relative to the tonic shape's base fret (negative = down the neck) */
  fretDelta: number;
}

export const TRIAD_SHAPE_STRING_SET = 'strings123' as const;

/** Open-string pitch classes of the G·B·e set, low to high. */
export const TOP_SET_OPEN_PITCH_CLASSES = [7, 11, 4] as const;

export const NEAREST_TRIAD_SHAPES: Record<KeyQuality, NearestShape[][]> = {
  major: [
    // starting from the tonic in root position
    [
      { quality: 'major', inversion: 0, fretDelta: 0 },
      { quality: 'minor', inversion: 0, fretDelta: 2 },
      { quality: 'minor', inversion: 2, fretDelta: 0 },
      { quality: 'major', inversion: 2, fretDelta: 2 },
      { quality: 'major', inversion: 1, fretDelta: 0 },
      { quality: 'minor', inversion: 1, fretDelta: 2 },
      { quality: 'diminished', inversion: 0, fretDelta: -2 },
    ],
    // starting from the tonic in 1st inversion
    [
      { quality: 'major', inversion: 1, fretDelta: 0 },
      { quality: 'minor', inversion: 1, fretDelta: 2 },
      { quality: 'minor', inversion: 0, fretDelta: -1 },
      { quality: 'major', inversion: 0, fretDelta: 0 },
      { quality: 'major', inversion: 2, fretDelta: -1 },
      { quality: 'minor', inversion: 2, fretDelta: 0 },
      { quality: 'diminished', inversion: 1, fretDelta: -2 },
    ],
    // starting from the tonic in 2nd inversion
    [
      { quality: 'major', inversion: 2, fretDelta: 0 },
      { quality: 'minor', inversion: 2, fretDelta: 1 },
      { quality: 'minor', inversion: 1, fretDelta: 0 },
      { quality: 'major', inversion: 1, fretDelta: 1 },
      { quality: 'major', inversion: 0, fretDelta: -2 },
      { quality: 'minor', inversion: 0, fretDelta: 0 },
      { quality: 'diminished', inversion: 2, fretDelta: -2 },
    ],
  ],
  minor: [
    // starting from the tonic in root position
    [
      { quality: 'minor', inversion: 0, fretDelta: 0 },
      { quality: 'diminished', inversion: 0, fretDelta: 1 },
      { quality: 'major', inversion: 2, fretDelta: 0 },
      { quality: 'minor', inversion: 2, fretDelta: 1 },
      { quality: 'minor', inversion: 1, fretDelta: 0 },
      { quality: 'major', inversion: 1, fretDelta: 1 },
      { quality: 'major', inversion: 0, fretDelta: -2 },
    ],
    // starting from the tonic in 1st inversion
    [
      { quality: 'minor', inversion: 1, fretDelta: 0 },
      { quality: 'diminished', inversion: 1, fretDelta: 1 },
      { quality: 'major', inversion: 0, fretDelta: -2 },
      { quality: 'minor', inversion: 0, fretDelta: 0 },
      { quality: 'minor', inversion: 2, fretDelta: -2 },
      { quality: 'major', inversion: 2, fretDelta: 0 },
      { quality: 'major', inversion: 1, fretDelta: -2 },
    ],
    // starting from the tonic in 2nd inversion
    [
      { quality: 'minor', inversion: 2, fretDelta: 0 },
      { quality: 'diminished', inversion: 2, fretDelta: 2 },
      { quality: 'major', inversion: 1, fretDelta: 0 },
      { quality: 'minor', inversion: 1, fretDelta: 2 },
      { quality: 'minor', inversion: 0, fretDelta: -1 },
      { quality: 'major', inversion: 0, fretDelta: 0 },
      { quality: 'major', inversion: 2, fretDelta: -1 },
    ],
  ],
};

export interface PlacedTriad {
  /** 1-7 */
  number: number;
  /** Chord symbol for the key, e.g. "Am" */
  symbol: string;
  quality: TriadQuality;
  shape: TriadShape;
  /** Lowest fret used by the voicing */
  baseFret: number;
}

/** Base fret (0-11) at which `shape` sounds a chord rooted on `rootPitchClass`. */
export function baseFretForRoot(shape: TriadShape, rootPitchClass: number): number {
  const r = shape.roles.indexOf('R');
  const raw = rootPitchClass - TOP_SET_OPEN_PITCH_CLASSES[r] - shape.offsets[r];
  return ((raw % 12) + 12) % 12;
}

/**
 * Place the voicings for every diatonic chord of a key on the top strings,
 * starting from the tonic in the given inversion and following the static
 * nearest-shape mapping. The whole group is lifted an octave if any shape
 * would fall below the nut.
 */
export function placeDiatonicTriads(
  keyPitchClass: number,
  keyQuality: KeyQuality,
  tonicInversion: number,
): PlacedTriad[] {
  const row = NEAREST_TRIAD_SHAPES[keyQuality][tonicInversion];
  const tonicShape = TRIAD_SHAPES[TRIAD_SHAPE_STRING_SET][keyQuality][tonicInversion];
  const tonicBase = baseFretForRoot(tonicShape, keyPitchClass);

  const placed = row.map((n, i) => {
    const chord = diatonicChord(keyPitchClass, keyQuality, i + 1);
    return {
      number: i + 1,
      symbol: chord.symbol,
      quality: n.quality,
      shape: TRIAD_SHAPES[TRIAD_SHAPE_STRING_SET][n.quality][n.inversion],
      baseFret: tonicBase + n.fretDelta,
    };
  });
  const lift = Math.min(...placed.map(p => p.baseFret)) < 0 ? 12 : 0;
  return placed.map(p => ({ ...p, baseFret: p.baseFret + lift }));
}
