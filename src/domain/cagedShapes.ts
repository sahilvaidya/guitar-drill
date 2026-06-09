import { GUITAR_STRINGS } from './guitarString';

/**
 * CAGED study data.
 *
 * All shapes are defined in the canonical key of C major / A minor and are
 * moveable: slide a box to put its root on a different note and the offsets
 * stay the same.  Degree labels are derived from pitch classes rather than
 * hand-typed per shape, so major and minor framings share one data set.
 */

export type KeyMode = 'major' | 'minor';

/** Degree label keyed by absolute pitch class in the canonical C major key. */
const MAJOR_DEGREE: Record<number, string> = {
  0: 'R', 2: '2', 4: '3', 5: '4', 7: '5', 9: '6', 11: '7',
};

/** Degree label keyed by absolute pitch class in the canonical A minor key. */
const MINOR_DEGREE: Record<number, string> = {
  9: 'R', 11: '2', 0: '♭3', 2: '4', 4: '5', 5: '♭6', 7: '♭7',
};

/**
 * Scale-degree label for a pitch class in the canonical key
 * (C major when mode is 'major', A minor when mode is 'minor').
 * Returns undefined for chromatic notes outside the key.
 */
export function degreeLabel(pitchClass: number, mode: KeyMode): string | undefined {
  const pc = ((pitchClass % 12) + 12) % 12;
  return mode === 'major' ? MAJOR_DEGREE[pc] : MINOR_DEGREE[pc];
}

/** Pitch class sounded at a fret, using the app-wide string definitions. */
export function pitchClassAt(stringIndex: number, fret: number): number {
  return (GUITAR_STRINGS[stringIndex].openPitchClass + fret) % 12;
}

// ─── Position boxes (pentatonic + full scale) ───────────────────────────────

/**
 * One moveable CAGED position box.
 *
 * `frets` holds fret offsets from `baseFret` per string, index 0 = low E
 * through index 5 = high e.  `baseFret` is the canonical placement in
 * C major / A minor, so absolute fret = baseFret + offset.
 */
export interface CagedBox {
  /** CAGED chord shape this box wraps around in the major framing, e.g. 'C'. */
  majorShape: string;
  /** Equivalent minor chord shape in the relative-minor framing, e.g. 'Am'. */
  minorShape: string;
  /** Canonical base fret in C major / A minor. */
  baseFret: number;
  /** Fret offsets from baseFret, per string low E → high e. */
  frets: number[][];
}

export function boxShapeName(box: CagedBox, mode: KeyMode): string {
  return mode === 'major' ? box.majorShape : box.minorShape;
}

/**
 * The five pentatonic boxes, ordered up the neck.
 * Major framing: C major pentatonic (C D E G A).
 * Minor framing: A minor pentatonic (A C D E G) — same notes, root moves.
 */
export const PENTATONIC_BOXES: CagedBox[] = [
  {
    majorShape: 'A', minorShape: 'Gm', baseFret: 2,
    frets: [[1, 3], [1, 3], [0, 3], [0, 3], [1, 3], [1, 3]],
  },
  {
    majorShape: 'G', minorShape: 'Em', baseFret: 5,
    frets: [[0, 3], [0, 2], [0, 2], [0, 2], [0, 3], [0, 3]],
  },
  {
    majorShape: 'E', minorShape: 'Dm', baseFret: 7,
    frets: [[1, 3], [0, 3], [0, 3], [0, 2], [1, 3], [1, 3]],
  },
  {
    majorShape: 'D', minorShape: 'Cm', baseFret: 9,
    frets: [[1, 3], [1, 3], [1, 3], [0, 3], [1, 4], [1, 3]],
  },
  {
    majorShape: 'C', minorShape: 'Am', baseFret: 12,
    frets: [[0, 3], [0, 3], [0, 2], [0, 2], [1, 3], [0, 3]],
  },
];

/**
 * The five full-scale boxes, ordered up the neck.
 * Major framing: C major scale.  Minor framing: A natural minor scale.
 */
export const SCALE_BOXES: CagedBox[] = [
  {
    majorShape: 'A', minorShape: 'Gm', baseFret: 2,
    frets: [[1, 3], [0, 1, 3], [0, 1, 3], [0, 2, 3], [1, 3], [1, 3]],
  },
  {
    majorShape: 'G', minorShape: 'Em', baseFret: 4,
    frets: [[1, 3, 4], [1, 3, 4], [1, 3], [0, 1, 3], [1, 2, 4], [1, 3, 4]],
  },
  {
    majorShape: 'E', minorShape: 'Dm', baseFret: 7,
    frets: [[0, 1, 3], [0, 1, 3], [0, 2, 3], [0, 2, 3], [1, 3], [0, 1, 3]],
  },
  {
    majorShape: 'D', minorShape: 'Cm', baseFret: 9,
    frets: [[1, 3, 4], [1, 3], [0, 1, 3], [0, 1, 3], [1, 3, 4], [1, 3, 4]],
  },
  {
    majorShape: 'C', minorShape: 'Am', baseFret: 12,
    frets: [[0, 1, 3], [0, 2, 3], [0, 2, 3], [0, 2], [0, 1, 3], [0, 1, 3]],
  },
];

// ─── Two-string interval runs (thirds & sixths) ──────────────────────────────

export type IntervalQuality = 'M3' | 'm3' | 'M6' | 'm6';

export interface RunStep {
  lowerFret: number;
  upperFret: number;
  /** Scale degree of the lower (melody) note in C major: 'R', '2', … '7'. */
  lowerDegree: string;
  /** Scale degree of the harmony note in C major. */
  upperDegree: string;
  quality: IntervalQuality;
}

export interface IntervalRun {
  /** Lower-pitched string index (0 = low E … 5 = high e). */
  lowerString: number;
  /** Higher-pitched string index. */
  upperString: number;
  steps: RunStep[];
}

const C_MAJOR_PCS = [0, 2, 4, 5, 7, 9, 11];

/**
 * Harmonize one octave of the C major scale on a string pair.
 *
 * @param lowerString    string index carrying the scale (the lower voice)
 * @param upperString    string index carrying the harmony note
 * @param scaleStepOffset 2 for thirds, 5 for sixths (diatonic steps above)
 * @param startDegreeIndex 0-based index into the C major scale to start from,
 *                         chosen per pair so the run begins near the nut
 */
export function buildDiatonicRun(
  lowerString: number,
  upperString: number,
  scaleStepOffset: number,
  startDegreeIndex: number,
  count = 8,
): IntervalRun {
  const lowerOpen = GUITAR_STRINGS[lowerString].openPitchClass;
  const upperOpen = GUITAR_STRINGS[upperString].openPitchClass;
  const steps: RunStep[] = [];
  let prevLowerFret = -1;

  for (let i = 0; i < count; i++) {
    const di = (startDegreeIndex + i) % 7;
    const lowerPc = C_MAJOR_PCS[di];
    const upperPc = C_MAJOR_PCS[(di + scaleStepOffset) % 7];

    let lowerFret = ((lowerPc - lowerOpen) % 12 + 12) % 12;
    while (lowerFret <= prevLowerFret) lowerFret += 12;
    prevLowerFret = lowerFret;

    // Pick the congruent upper fret voiced against this lower fret.
    let upperFret = ((upperPc - upperOpen) % 12 + 12) % 12;
    while (upperFret < lowerFret - 6) upperFret += 12;

    const semis = ((upperPc - lowerPc) % 12 + 12) % 12;
    const quality: IntervalQuality =
      scaleStepOffset === 2 ? (semis === 4 ? 'M3' : 'm3') : (semis === 9 ? 'M6' : 'm6');

    steps.push({
      lowerFret,
      upperFret,
      lowerDegree: MAJOR_DEGREE[lowerPc],
      upperDegree: MAJOR_DEGREE[upperPc],
      quality,
    });
  }

  return { lowerString, upperString, steps };
}

/**
 * Diatonic thirds on each adjacent pair of the first four strings.
 * Start degrees keep each run close to the nut.
 */
export const THIRDS_RUNS: IntervalRun[] = [
  buildDiatonicRun(4, 5, 2, 0), // B + e, starting on C
  buildDiatonicRun(3, 4, 2, 4), // G + B, starting on G
  buildDiatonicRun(2, 3, 2, 2), // D + G, starting on E
];

/**
 * Diatonic sixths on string pairs that skip one string.
 */
export const SIXTHS_RUNS: IntervalRun[] = [
  buildDiatonicRun(3, 5, 5, 4), // G + e, starting on G
  buildDiatonicRun(2, 4, 5, 2), // D + B, starting on E
];
