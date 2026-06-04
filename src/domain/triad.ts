import { NoteName, noteNameFromPitchClass } from './noteName';

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented';

export const TRIAD_QUALITIES: TriadQuality[] = ['major', 'minor', 'diminished', 'augmented'];

/** Semitone intervals from root: [root, third, fifth] */
export const TRIAD_INTERVALS: Record<TriadQuality, [number, number, number]> = {
  major:      [0, 4, 7],
  minor:      [0, 3, 7],
  diminished: [0, 3, 6],
  augmented:  [0, 4, 8],
};

export const TRIAD_FORMULA: Record<TriadQuality, string> = {
  major:      '1 – 3 – 5',
  minor:      '1 – ♭3 – 5',
  diminished: '1 – ♭3 – ♭5',
  augmented:  '1 – 3 – ♯5',
};

export const TRIAD_DESCRIPTION: Record<TriadQuality, string> = {
  major:      'Bright, stable sound. Built with a major third + perfect fifth.',
  minor:      'Dark, melancholic sound. Built with a minor third + perfect fifth.',
  diminished: 'Tense, unstable sound. Built with a minor third + diminished fifth.',
  augmented:  'Mysterious, unresolved sound. Built with a major third + augmented fifth.',
};

export const TRIAD_COLOR: Record<TriadQuality, string> = {
  major:      '#007AFF', // blue
  minor:      '#5856D6', // purple
  diminished: '#FF3B30', // red
  augmented:  '#FF9500', // orange
};

/** Display label for a triad quality */
export const TRIAD_LABEL: Record<TriadQuality, string> = {
  major:      'Major',
  minor:      'Minor',
  diminished: 'Diminished',
  augmented:  'Augmented',
};

/**
 * Compute the three note names of a triad.
 * @param rootPitchClass  0 = C, 1 = C#/Db, … 11 = B
 * @param quality         Triad quality
 */
export function triadNotes(
  rootPitchClass: number,
  quality: TriadQuality,
): [NoteName, NoteName, NoteName] {
  const [i0, i1, i2] = TRIAD_INTERVALS[quality];
  return [
    noteNameFromPitchClass(rootPitchClass + i0),
    noteNameFromPitchClass(rootPitchClass + i1),
    noteNameFromPitchClass(rootPitchClass + i2),
  ];
}
