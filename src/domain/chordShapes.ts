import { FretPosition } from './fretPosition';
import { GUITAR_STRINGS } from './guitarString';
import { pitchDisplayName } from './chordDetect';

/**
 * Chord shape library for the Chords study section.
 *
 * `frets` are per string low E → high e: -1 = muted, 0 = open, n = fret.
 * `fingers` use 0 for "no finger" (open/muted strings).
 *
 * Moveable shapes are defined with the root fret at 1 (the F / Bb position);
 * use `rootFretFor` + `transposedFrets` to place them anywhere on the neck.
 * Every voicing is verified against the chord detector in unit tests.
 */

export interface Barre {
  fret: number;
  /** String index range covered, low E = 0 … high e = 5. */
  fromString: number;
  toString: number;
}

export interface ChordShape {
  /** Chord symbol, e.g. 'C', 'Am', 'G7'. */
  label: string;
  rootPc: number;
  frets: number[];
  fingers: number[];
  barre?: Barre;
}

export interface MoveableChordShape {
  /** Quality suffix appended to the root name, e.g. '' | 'm' | '7' | 'maj7' | '5'. */
  suffix: string;
  /** The open shape this barre form is based on, e.g. 'E shape'. */
  shapeName: string;
  /** String index carrying the root: 0 (6th string) or 1 (5th string). */
  rootString: number;
  frets: number[];
  fingers: number[];
  barre?: Barre;
}

// ── Open chords ──────────────────────────────────────────────────────────────

export const OPEN_CHORDS: ChordShape[] = [
  { label: 'C',  rootPc: 0,  frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  { label: 'A',  rootPc: 9,  frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  { label: 'G',  rootPc: 7,  frets: [3, 2, 0, 0, 0, 3],  fingers: [2, 1, 0, 0, 0, 3] },
  { label: 'E',  rootPc: 4,  frets: [0, 2, 2, 1, 0, 0],  fingers: [0, 2, 3, 1, 0, 0] },
  { label: 'D',  rootPc: 2,  frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  { label: 'Am', rootPc: 9,  frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  { label: 'Em', rootPc: 4,  frets: [0, 2, 2, 0, 0, 0],  fingers: [0, 2, 3, 0, 0, 0] },
  { label: 'Dm', rootPc: 2,  frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
];

// ── Open 7th chords ──────────────────────────────────────────────────────────

export const OPEN_SEVENTH_CHORDS: ChordShape[] = [
  { label: 'G7', rootPc: 7,  frets: [3, 2, 0, 0, 0, 1],  fingers: [3, 2, 0, 0, 0, 1] },
  { label: 'C7', rootPc: 0,  frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  { label: 'D7', rootPc: 2,  frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  { label: 'A7', rootPc: 9,  frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  { label: 'E7', rootPc: 4,  frets: [0, 2, 0, 1, 0, 0],  fingers: [0, 2, 0, 1, 0, 0] },
  { label: 'B7', rootPc: 11, frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
];

// ── Suspended chords (open) ──────────────────────────────────────────────────

export const SUS_CHORDS: ChordShape[] = [
  { label: 'Asus2', rootPc: 9, frets: [-1, 0, 2, 2, 0, 0],  fingers: [0, 0, 1, 2, 0, 0] },
  { label: 'Asus4', rootPc: 9, frets: [-1, 0, 2, 2, 3, 0],  fingers: [0, 0, 1, 2, 3, 0] },
  { label: 'Dsus2', rootPc: 2, frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  { label: 'Dsus4', rootPc: 2, frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
  { label: 'Esus4', rootPc: 4, frets: [0, 2, 2, 2, 0, 0],   fingers: [0, 2, 3, 4, 0, 0] },
];

// ── Moveable barre shapes ────────────────────────────────────────────────────

/** Root on the 6th string — the E-family barre forms (at fret 1: F, Fm, F7 …). */
export const BARRE_6TH_SHAPES: MoveableChordShape[] = [
  {
    suffix: '', shapeName: 'E shape', rootString: 0,
    frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
  },
  {
    suffix: 'm', shapeName: 'Em shape', rootString: 0,
    frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
  },
  {
    suffix: '7', shapeName: 'E7 shape', rootString: 0,
    frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
  },
  {
    suffix: 'm7', shapeName: 'Em7 shape', rootString: 0,
    frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
  },
  {
    // Not a barre, but the standard moveable maj7 voicing with a 6th-string root
    suffix: 'maj7', shapeName: 'maj7 shape', rootString: 0,
    frets: [1, -1, 2, 2, 1, -1], fingers: [1, 0, 3, 4, 2, 0],
  },
];

/** Root on the 5th string — the A-family barre forms (at fret 1: Bb, Bbm, Bb7 …). */
export const BARRE_5TH_SHAPES: MoveableChordShape[] = [
  {
    suffix: '', shapeName: 'A shape', rootString: 1,
    frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1],
    barre: { fret: 1, fromString: 1, toString: 5 },
  },
  {
    suffix: 'm', shapeName: 'Am shape', rootString: 1,
    frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1],
    barre: { fret: 1, fromString: 1, toString: 5 },
  },
  {
    suffix: '7', shapeName: 'A7 shape', rootString: 1,
    frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1],
    barre: { fret: 1, fromString: 1, toString: 5 },
  },
  {
    suffix: 'm7', shapeName: 'Am7 shape', rootString: 1,
    frets: [-1, 1, 3, 1, 2, 1], fingers: [0, 1, 3, 1, 2, 1],
    barre: { fret: 1, fromString: 1, toString: 5 },
  },
  {
    suffix: 'maj7', shapeName: 'Amaj7 shape', rootString: 1,
    frets: [-1, 1, 3, 2, 3, 1], fingers: [0, 1, 3, 2, 4, 1],
    barre: { fret: 1, fromString: 1, toString: 5 },
  },
];

/** Root + fifth — not full chords, but essential rhythm-guitar shapes. */
export const POWER_CHORD_SHAPES: MoveableChordShape[] = [
  {
    suffix: '5', shapeName: '6th-string root', rootString: 0,
    frets: [1, 3, 3, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0],
  },
  {
    suffix: '5', shapeName: '5th-string root', rootString: 1,
    frets: [-1, 1, 3, 3, -1, -1], fingers: [0, 1, 3, 4, 0, 0],
  },
];

// ── Moveable-shape helpers ───────────────────────────────────────────────────

/** Fret where the shape's root string sounds the given root (12 instead of 0). */
export function rootFretFor(shape: MoveableChordShape, rootPc: number): number {
  const open = GUITAR_STRINGS[shape.rootString].openPitchClass;
  const fret = ((rootPc - open) % 12 + 12) % 12;
  return fret === 0 ? 12 : fret;
}

/** Shift a moveable shape (defined with the root at fret 1) to a root fret. */
export function transposedFrets(shape: MoveableChordShape, rootFret: number): number[] {
  return shape.frets.map(f => (f > 0 ? f + rootFret - 1 : f));
}

export function moveableChordName(shape: MoveableChordShape, rootPc: number): string {
  return pitchDisplayName(rootPc) + shape.suffix;
}

/** Sounding positions of a fretting (muted strings skipped) — used for verification. */
export function shapePositions(frets: number[]): FretPosition[] {
  const positions: FretPosition[] = [];
  frets.forEach((fret, stringIndex) => {
    if (fret >= 0) positions.push({ string: GUITAR_STRINGS[stringIndex], fret });
  });
  return positions;
}
