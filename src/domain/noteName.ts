export type NoteName =
  | 'A' | 'A#/Bb'
  | 'B'
  | 'C' | 'C#/Db'
  | 'D' | 'D#/Eb'
  | 'E'
  | 'F' | 'F#/Gb'
  | 'G' | 'G#/Ab';

export const naturalNotes: NoteName[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export const chromaticNotes: NoteName[] = [
  'A', 'A#/Bb', 'B', 'C', 'C#/Db', 'D',
  'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab',
];

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
