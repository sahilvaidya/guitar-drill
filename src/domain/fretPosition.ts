import { GuitarStringDef, GUITAR_STRINGS } from './guitarString';
import { NoteName, noteNameFromPitchClass, isNatural } from './noteName';
import { NotePracticeMode } from './notePracticeMode';
import { FretRange, fretRangeToArray } from './fretRange';

export interface FretPosition {
  string: GuitarStringDef;
  fret: number;
}

export function fretPositionId(pos: FretPosition): string {
  return `${pos.string.index}-${pos.fret}`;
}

export function chromaticNoteName(pos: FretPosition): NoteName {
  const pitchClass = (pos.string.openPitchClass + pos.fret) % 12;
  return noteNameFromPitchClass(pitchClass);
}

export function naturalNoteName(pos: FretPosition): NoteName | null {
  const note = chromaticNoteName(pos);
  return isNatural(note) ? note : null;
}

export function noteNameForMode(pos: FretPosition, mode: NotePracticeMode): NoteName | null {
  if (mode === 'chromatic') return chromaticNoteName(pos);
  return naturalNoteName(pos);
}

export function getAllPositionsForNote(note: NoteName, fretRange: FretRange): FretPosition[] {
  const frets = fretRangeToArray(fretRange);
  const positions: FretPosition[] = [];
  for (const string of GUITAR_STRINGS) {
    for (const fret of frets) {
      const pos: FretPosition = { string, fret };
      if (chromaticNoteName(pos) === note) positions.push(pos);
    }
  }
  return positions;
}
