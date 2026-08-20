// Chord-number practice domain logic. Pure TS, no RN deps.
//
// Generates a short random progression expressed in the Nashville number
// system (1–7) in a random major or minor key. The player's job is to link
// each number to the actual chord and find it on the neck, so the prompt
// itself only carries the key and the numbers — the diatonic chord spellings
// are computed on demand for self-checking.

export type KeyQuality = 'major' | 'minor';

export type ChordQuality = 'major' | 'minor' | 'diminished';

export const MIN_CHORDS = 2;
export const MAX_CHORDS = 5;

/** Semitone offsets of each scale degree from the tonic. */
const MAJOR_SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11] as const;
const NATURAL_MINOR_SCALE_OFFSETS = [0, 2, 3, 5, 7, 8, 10] as const;

/** Diatonic triad quality for each degree (index 0 = degree 1). */
const MAJOR_KEY_QUALITIES: ChordQuality[] = [
  'major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished',
];
const MINOR_KEY_QUALITIES: ChordQuality[] = [
  'minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major',
];

/** Natural (unaltered) pitch class of each letter name. */
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const LETTER_PITCH_CLASS: Record<(typeof LETTERS)[number], number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

/**
 * Tonic spellings chosen to keep every diatonic chord to a single accidental
 * (no double sharps/flats) while preferring the more common key spelling.
 * Indexed by pitch class (0 = C).
 */
const MAJOR_TONIC_SPELLING = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];
const MINOR_TONIC_SPELLING = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B',
];

export interface KeySpelling {
  /** Letter A–G. */
  letter: (typeof LETTERS)[number];
  /** Accidental applied to the letter: '', '#', 'b', '##', 'bb'. */
  accidental: string;
  pitchClass: number;
}

export interface DiatonicChord {
  /** 1–7 */
  number: number;
  quality: ChordQuality;
  /** Root note spelled for the key, e.g. "F#", "Bb". */
  root: string;
  /** Full chord symbol, e.g. "G", "Am", "F#dim". */
  symbol: string;
}

export interface ChordNumberPrompt {
  keyPitchClass: number;
  keyQuality: KeyQuality;
  /** Tonic spelled for the key, e.g. "Eb". */
  keyRoot: string;
  /** Human-readable key label, e.g. "Eb major". */
  keyLabel: string;
  /** The progression, each entry a scale-degree number 1–7. */
  numbers: number[];
}

const CHORD_SUFFIX: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
};

function accidentalForDelta(delta: number): string {
  // Fold the pitch-class difference into the range -6..6 so we pick the
  // nearest spelling instead of, say, "+11" for a flat.
  let d = ((delta % 12) + 12) % 12;
  if (d > 6) d -= 12;
  switch (d) {
    case 0: return '';
    case 1: return '#';
    case 2: return '##';
    case -1: return 'b';
    case -2: return 'bb';
    default:
      // Should never happen for diatonic spellings with the tonic table above.
      throw new Error(`Unexpected accidental delta: ${d}`);
  }
}

/** Parse a tonic spelling like "Eb" or "F#" into letter + pitch class. */
export function parseKeyRoot(spelling: string): KeySpelling {
  const letter = spelling[0] as (typeof LETTERS)[number];
  const accidental = spelling.slice(1);
  let pc = LETTER_PITCH_CLASS[letter];
  for (const ch of accidental) {
    if (ch === '#') pc += 1;
    else if (ch === 'b') pc -= 1;
  }
  return { letter, accidental, pitchClass: ((pc % 12) + 12) % 12 };
}

function tonicSpelling(keyPitchClass: number, keyQuality: KeyQuality): string {
  const pc = ((keyPitchClass % 12) + 12) % 12;
  return keyQuality === 'major'
    ? MAJOR_TONIC_SPELLING[pc]
    : MINOR_TONIC_SPELLING[pc];
}

export function keyLabel(keyPitchClass: number, keyQuality: KeyQuality): string {
  return `${tonicSpelling(keyPitchClass, keyQuality)} ${keyQuality}`;
}

/**
 * Spell the diatonic chord for a scale-degree number (1–7) in the given key.
 * Roots step through the musical alphabet so each degree gets its own letter,
 * e.g. degree 7 in F# major is E# rather than F.
 */
export function diatonicChord(
  keyPitchClass: number,
  keyQuality: KeyQuality,
  number: number,
): DiatonicChord {
  if (number < 1 || number > 7) {
    throw new Error(`Chord number out of range 1–7: ${number}`);
  }
  const degree = number - 1;
  const offsets = keyQuality === 'major'
    ? MAJOR_SCALE_OFFSETS
    : NATURAL_MINOR_SCALE_OFFSETS;
  const qualities = keyQuality === 'major'
    ? MAJOR_KEY_QUALITIES
    : MINOR_KEY_QUALITIES;

  const tonic = parseKeyRoot(tonicSpelling(keyPitchClass, keyQuality));
  const tonicLetterIdx = LETTERS.indexOf(tonic.letter);

  const letter = LETTERS[(tonicLetterIdx + degree) % 7];
  const targetPc = (tonic.pitchClass + offsets[degree]) % 12;
  const accidental = accidentalForDelta(targetPc - LETTER_PITCH_CLASS[letter]);
  const root = `${letter}${accidental}`;
  const quality = qualities[degree];

  return { number, quality, root, symbol: `${root}${CHORD_SUFFIX[quality]}` };
}

/** All seven diatonic chords of the key, in degree order 1→7. */
export function diatonicChords(
  keyPitchClass: number,
  keyQuality: KeyQuality,
): DiatonicChord[] {
  return [1, 2, 3, 4, 5, 6, 7].map(n =>
    diatonicChord(keyPitchClass, keyQuality, n),
  );
}

/**
 * Build a random progression of chord numbers.
 * @param count       how many chords (2–5)
 * @param rng         injectable [0,1) source for testing
 * Consecutive numbers never repeat, so the progression always moves.
 */
export function randomChordNumbers(
  count: number,
  rng: () => number = Math.random,
): number[] {
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    let next = 1 + Math.floor(rng() * 7);
    if (next > 7) next = 7; // guard against rng() === 1
    if (i > 0 && next === numbers[i - 1]) {
      // Rotate to the next degree so we never repeat the previous chord.
      next = (next % 7) + 1;
    }
    numbers.push(next);
  }
  return numbers;
}

/**
 * Generate a full practice prompt: a random major/minor key and a random
 * progression of 2–5 chord numbers.
 */
export function generateChordNumberPrompt(
  rng: () => number = Math.random,
): ChordNumberPrompt {
  const keyPitchClass = Math.min(11, Math.floor(rng() * 12));
  const keyQuality: KeyQuality = rng() < 0.5 ? 'major' : 'minor';
  const count = MIN_CHORDS + Math.floor(rng() * (MAX_CHORDS - MIN_CHORDS + 1));
  const clampedCount = Math.min(MAX_CHORDS, Math.max(MIN_CHORDS, count));
  const numbers = randomChordNumbers(clampedCount, rng);

  return {
    keyPitchClass,
    keyQuality,
    keyRoot: tonicSpelling(keyPitchClass, keyQuality),
    keyLabel: keyLabel(keyPitchClass, keyQuality),
    numbers,
  };
}
