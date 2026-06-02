import { GuitarStringDef } from './guitarString';
import { NoteName, noteNameFromPitchClass, isNatural } from './noteName';
import { NotePracticeMode } from './notePracticeMode';

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
