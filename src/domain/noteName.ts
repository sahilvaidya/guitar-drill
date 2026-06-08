export type NoteName =
  | 'A' | 'A#/Bb'
  | 'B'
  | 'C' | 'C#/Db'
  | 'D' | 'D#/Eb'
  | 'E'
  | 'F' | 'F#/Gb'
  | 'G' | 'G#/Ab';

export type AccidentalDisplay = 'sharp' | 'flat';

export const naturalNotes: NoteName[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export const chromaticNotes: NoteName[] = [
  'A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D',
  'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab',
];

const chromaticSharpDisplay: string[] = [
  'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#',
];

const chromaticFlatDisplay: string[] = [
  'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab',
];

export function displayChromaticChoices(display: AccidentalDisplay): string[] {
  return display === 'sharp' ? chromaticSharpDisplay : chromaticFlatDisplay;
}

const displayToCanonical: Record<string, NoteName> = {
  'A#': 'A#/Bb', 'Bb': 'A#/Bb',
  'C#': 'C#/Db', 'Db': 'C#/Db',
  'D#': 'D#/Eb', 'Eb': 'D#/Eb',
  'F#': 'F#/Gb', 'Gb': 'F#/Gb',
  'G#': 'G#/Ab', 'Ab': 'G#/Ab',
};

export function normalizeToCanonical(display: string): NoteName {
  return displayToCanonical[display] ?? (display as NoteName);
}

// pitch class 0 = C
const pitchClassToNote: Record<number, NoteName> = {
  0: 'C',
  1: 'C#/Db',
  2: 'D',
  3: 'D#/Eb',
  4: 'E',
  5: 'F',
  6: 'F#/Gb',
  7: 'G',
  8: 'G#/Ab',
  9: 'A',
  10: 'A#/Bb',
  11: 'B',
};

export function noteNameFromPitchClass(pitchClass: number): NoteName {
  return pitchClassToNote[((pitchClass % 12) + 12) % 12];
}

export function isNatural(note: NoteName): boolean {
  return (naturalNotes as string[]).includes(note);
}

export function accessibilityId(note: NoteName): string {
  return note.replace('/', '_').replace('#', 's').replace('b', 'f');
}

export function displayNoteForAccidental(note: NoteName, display: AccidentalDisplay): string {
  if (isNatural(note)) return note;
  const idx = chromaticNotes.indexOf(note);
  if (idx === -1) return note;
  return display === 'sharp' ? chromaticSharpDisplay[idx] : chromaticFlatDisplay[idx];
}
