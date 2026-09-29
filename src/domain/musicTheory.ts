// Music theory study data: scale construction and the circle of fifths.
// Pure TS, no RN deps.

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/** Tonics offered in the root picker. */
export const THEORY_ROOTS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

// ─── Scale construction ──────────────────────────────────────────────────────

export type ScaleId =
  | 'major' | 'naturalMinor' | 'harmonicMinor' | 'melodicMinor'
  | 'dorian' | 'mixolydian' | 'majorPentatonic' | 'minorPentatonic' | 'blues';

export interface ScaleDef {
  id: ScaleId;
  label: string;
  /** Semitones above the root for each note, ascending. */
  semitones: number[];
  /** Letter-name step (1 = same letter as root … 7) for each note, so spelling stays A–G. */
  letterSteps: number[];
  /** One-line description of how it is built and how it sounds. */
  description: string;
}

export const SCALES: ScaleDef[] = [
  {
    id: 'major', label: 'Major',
    semitones: [0, 2, 4, 5, 7, 9, 11], letterSteps: [1, 2, 3, 4, 5, 6, 7],
    description: 'The reference scale. Bright and resolved; everything else is described by how it differs from this.',
  },
  {
    id: 'naturalMinor', label: 'Natural minor',
    semitones: [0, 2, 3, 5, 7, 8, 10], letterSteps: [1, 2, 3, 4, 5, 6, 7],
    description: 'Major with a flattened 3rd, 6th and 7th. Dark and serious; it is the major scale started from its 6th degree.',
  },
  {
    id: 'harmonicMinor', label: 'Harmonic minor',
    semitones: [0, 2, 3, 5, 7, 8, 11], letterSteps: [1, 2, 3, 4, 5, 6, 7],
    description: 'Natural minor with the 7th raised. The leading tone gives a strong V chord; the ♭6→7 gap is a step and a half.',
  },
  {
    id: 'melodicMinor', label: 'Melodic minor',
    semitones: [0, 2, 3, 5, 7, 9, 11], letterSteps: [1, 2, 3, 4, 5, 6, 7],
    description: 'Major with only the 3rd flattened (ascending form). Smooth stepwise motion with a minor sound.',
  },
  {
    id: 'dorian', label: 'Dorian',
    semitones: [0, 2, 3, 5, 7, 9, 10], letterSteps: [1, 2, 3, 4, 5, 6, 7],
    description: 'Minor with a raised 6th (or major with ♭3 and ♭7). Minor but less gloomy — funk, jazz and Santana.',
  },
  {
    id: 'mixolydian', label: 'Mixolydian',
    semitones: [0, 2, 4, 5, 7, 9, 10], letterSteps: [1, 2, 3, 4, 5, 6, 7],
    description: 'Major with a flattened 7th. The scale of dominant 7th chords, blues-rock and classic rock riffs.',
  },
  {
    id: 'majorPentatonic', label: 'Major pentatonic',
    semitones: [0, 2, 4, 7, 9], letterSteps: [1, 2, 3, 5, 6],
    description: 'Major with the 4th and 7th removed — the two notes that clash with the tonic chord.',
  },
  {
    id: 'minorPentatonic', label: 'Minor pentatonic',
    semitones: [0, 3, 5, 7, 10], letterSteps: [1, 3, 4, 5, 7],
    description: 'Natural minor with the 2nd and ♭6 removed. The backbone of blues and rock soloing.',
  },
  {
    id: 'blues', label: 'Blues',
    semitones: [0, 3, 5, 6, 7, 10], letterSteps: [1, 3, 4, 5, 5, 7],
    description: 'Minor pentatonic plus the ♭5 "blue note" between the 4th and 5th.',
  },
];

export function scaleById(id: ScaleId): ScaleDef {
  return SCALES.find(s => s.id === id)!;
}

/** Parse a tonic like "Eb" or "F#" into letter index and pitch class. */
function parseRoot(root: string): { letterIndex: number; pitchClass: number } {
  const letterIndex = LETTERS.indexOf(root[0] as (typeof LETTERS)[number]);
  let pc = LETTER_PC[root[0]];
  for (const ch of root.slice(1)) pc += ch === '#' ? 1 : ch === 'b' ? -1 : 0;
  return { letterIndex, pitchClass: ((pc % 12) + 12) % 12 };
}

function spell(letter: string, targetPc: number): string {
  let delta = (((targetPc - LETTER_PC[letter]) % 12) + 12) % 12;
  if (delta > 6) delta -= 12;
  if (delta === 0) return letter;
  return letter + (delta > 0 ? '#'.repeat(delta) : 'b'.repeat(-delta));
}

/** The notes of a scale spelled from a root, one letter per degree (root first). */
export function spellScale(root: string, scale: ScaleDef): string[] {
  const { letterIndex, pitchClass } = parseRoot(root);
  return scale.semitones.map((semis, i) => {
    const letter = LETTERS[(letterIndex + scale.letterSteps[i] - 1) % 7];
    return spell(letter, (pitchClass + semis) % 12);
  });
}

/** Degree labels relative to the major scale, e.g. minor → 1 2 ♭3 4 5 ♭6 ♭7. */
export function degreeFormula(scale: ScaleDef): string[] {
  return scale.semitones.map((semis, i) => {
    const step = scale.letterSteps[i];
    const delta = semis - MAJOR_SEMITONES[step - 1];
    const prefix = delta === 0 ? '' : delta > 0 ? '♯'.repeat(delta) : '♭'.repeat(-delta);
    return `${prefix}${step}`;
  });
}

/** Whole/half step pattern including the return to the octave: W W H W W W H. */
export function stepPattern(scale: ScaleDef): string[] {
  const out: string[] = [];
  const all = [...scale.semitones, 12];
  for (let i = 1; i < all.length; i++) {
    const gap = all[i] - all[i - 1];
    out.push(gap === 1 ? 'H' : gap === 2 ? 'W' : gap === 3 ? 'W+H' : `${gap}`);
  }
  return out;
}

// ─── Circle of fifths ────────────────────────────────────────────────────────

export interface CircleKey {
  /** Position clockwise from 12 o'clock (0 = C). */
  position: number;
  major: string;
  minor: string;
  /** Number of accidentals: positive = sharps, negative = flats. */
  accidentals: number;
  majorPitchClass: number;
}

/** Major keys clockwise from C. The 6 o'clock key is F# (6♯), also written Gb (6♭). */
const CIRCLE_MAJORS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
const CIRCLE_MINORS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'Bb', 'F', 'C', 'G', 'D'];
const CIRCLE_ACCIDENTALS = [0, 1, 2, 3, 4, 5, 6, -5, -4, -3, -2, -1];

export const CIRCLE_OF_FIFTHS: CircleKey[] = CIRCLE_MAJORS.map((major, position) => ({
  position,
  major,
  minor: CIRCLE_MINORS[position],
  accidentals: CIRCLE_ACCIDENTALS[position],
  majorPitchClass: (position * 7) % 12,
}));

export const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
export const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

/** Key signature of a circle key as accidental letters, e.g. D → ['F#', 'C#']. */
export function keySignature(key: CircleKey): string[] {
  return key.accidentals >= 0
    ? SHARP_ORDER.slice(0, key.accidentals).map(l => `${l}#`)
    : FLAT_ORDER.slice(0, -key.accidentals).map(l => `${l}b`);
}

/** "2♯", "3♭" or "no ♯/♭" for display. */
export function signatureLabel(key: CircleKey): string {
  if (key.accidentals === 0) return 'no ♯ or ♭';
  return `${Math.abs(key.accidentals)}${key.accidentals > 0 ? '♯' : '♭'}`;
}
