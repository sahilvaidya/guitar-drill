// Study reference data for the Intervals page. Pure TS, no RN deps.

import { INTERVAL_SEMITONES, IntervalName } from './earInterval';

/** Letter-name distance (2 = a "2nd" … 8 = octave) used to spell the interval. */
export const INTERVAL_LETTER_STEPS: Record<IntervalName, number> = {
  m2: 2, M2: 2, m3: 3, M3: 3, P4: 4, TT: 5,
  P5: 5, m6: 6, M6: 6, m7: 7, M7: 7, P8: 8,
};

/** How each interval sounds and feels — a one-line memory aid. */
export const INTERVAL_CHARACTER: Record<IntervalName, string> = {
  m2: 'Tense and dissonant — a single fret apart.',
  M2: 'A whole step; the basic step of the major scale.',
  m3: 'Sad, dark — the core of every minor chord.',
  M3: 'Bright, happy — the core of every major chord.',
  P4: 'Open and stable, with a pull to resolve down.',
  TT: 'Unstable and restless; the heart of a dominant 7th.',
  P5: 'Hollow and strong — the power chord interval.',
  m6: 'Bittersweet and yearning.',
  M6: 'Warm and sweet; common in country and pop lines.',
  m7: 'Bluesy, wants to resolve — the 7th of a dominant chord.',
  M7: 'Dreamy and tense, one fret shy of the octave.',
  P8: 'The same note at twice the frequency.',
};

/**
 * Where to find the upper note relative to the lower note, on the strings
 * E·A·D·G (adjacent strings a 4th apart). The G→B pair is tuned a major 3rd
 * apart, so shapes that cross it need one extra fret.
 */
export interface IntervalShape {
  /** How many strings up from the lower note (0 = same string). */
  stringsUp: number;
  /** Fret change relative to the lower note (negative = toward the nut). */
  fretDelta: number;
}

export const INTERVAL_SHAPES: Record<IntervalName, IntervalShape> = {
  m2: { stringsUp: 0, fretDelta: 1 },
  M2: { stringsUp: 0, fretDelta: 2 },
  m3: { stringsUp: 0, fretDelta: 3 },
  M3: { stringsUp: 1, fretDelta: -1 },
  P4: { stringsUp: 1, fretDelta: 0 },
  TT: { stringsUp: 1, fretDelta: 1 },
  P5: { stringsUp: 1, fretDelta: 2 },
  m6: { stringsUp: 1, fretDelta: 3 },
  M6: { stringsUp: 2, fretDelta: -1 },
  m7: { stringsUp: 2, fretDelta: 0 },
  M7: { stringsUp: 2, fretDelta: 1 },
  P8: { stringsUp: 2, fretDelta: 2 },
};

/** Plain-English description of an interval's fretboard shape. */
export function describeShape(interval: IntervalName): string {
  const { stringsUp, fretDelta } = INTERVAL_SHAPES[interval];
  const frets = Math.abs(fretDelta);
  const fretWord = `${frets} fret${frets === 1 ? '' : 's'}`;
  if (stringsUp === 0) return `Same string, ${fretWord} higher`;
  const strings = stringsUp === 1 ? 'One string up' : `${stringsUp} strings up`;
  if (fretDelta === 0) return `${strings}, same fret`;
  return `${strings}, ${fretWord} ${fretDelta > 0 ? 'higher' : 'lower'}`;
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Name the note `interval` above `root` (a natural letter, e.g. 'C'), spelled by letter. */
export function noteAbove(root: string, interval: IntervalName): string {
  const letter = LETTERS[(LETTERS.indexOf(root) + INTERVAL_LETTER_STEPS[interval] - 1) % 7];
  const target = (LETTER_PC[root] + INTERVAL_SEMITONES[interval]) % 12;
  let delta = (((target - LETTER_PC[letter]) % 12) + 12) % 12;
  if (delta > 6) delta -= 12;
  const acc = delta === 0 ? '' : delta > 0 ? '#'.repeat(delta) : 'b'.repeat(-delta);
  return `${letter}${acc}`;
}
