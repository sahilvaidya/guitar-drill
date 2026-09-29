// Pentatonic scale study data. Pure TS, no RN deps.

import { KeyQuality, diatonicChord, keyLabel } from './chordNumberPractice';
import { GUITAR_STRINGS } from './guitarString';

/** Scale degrees (1–7 of the parent scale) that make up each pentatonic. */
const PENTATONIC_DEGREES: Record<KeyQuality, number[]> = {
  major: [1, 2, 3, 5, 6],
  minor: [1, 3, 4, 5, 7],
};

export const PENTATONIC_FORMULA: Record<KeyQuality, string> = {
  major: '1 · 2 · 3 · 5 · 6',
  minor: '1 · ♭3 · 4 · 5 · ♭7',
};

/** The five notes of the pentatonic, spelled for the key (root first). */
export function pentatonicNotes(rootPitchClass: number, quality: KeyQuality): string[] {
  return PENTATONIC_DEGREES[quality].map(
    n => diatonicChord(rootPitchClass, quality, n).root,
  );
}

/** Pitch class of the relative key's root (minor 3rd below for major, above for minor). */
export function relativePitchClass(rootPitchClass: number, quality: KeyQuality): number {
  const shift = quality === 'major' ? -3 : 3;
  return (((rootPitchClass + shift) % 12) + 12) % 12;
}

/** Label of the relative key, e.g. "A minor" for C major. */
export function relativeLabel(rootPitchClass: number, quality: KeyQuality): string {
  const other: KeyQuality = quality === 'major' ? 'minor' : 'major';
  return keyLabel(relativePitchClass(rootPitchClass, quality), other);
}

/**
 * The blues note (♭5) added to the minor pentatonic, spelled as a raised 4th
 * of the minor key — e.g. D# in A minor.
 */
export function bluesNote(rootPitchClass: number): string {
  const fourth = diatonicChord(rootPitchClass, 'minor', 4).root;
  // Raising a flat gives the natural; raising a natural or sharp adds a sharp.
  return fourth.endsWith('b') ? fourth.slice(0, -1) : `${fourth}#`;
}

/** Fret (0–11) where `pitchClass` first sounds on a string. */
export function rootFretOnString(stringIndex: number, pitchClass: number): number {
  return (((pitchClass - GUITAR_STRINGS[stringIndex].openPitchClass) % 12) + 12) % 12;
}
