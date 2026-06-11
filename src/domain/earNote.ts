// Ear training: note identification domain logic. Pure TS, no RN deps.

import { NoteName, noteNameFromPitchClass, naturalNotes, chromaticNotes } from '@/domain/noteName';

export type EarNoteSet = 'natural' | 'chromatic';

export const DEFAULT_EAR_NOTE_SET: EarNoteSet = 'natural';

// C3 to C5 inclusive (C4 = middle C = 60)
export const EAR_NOTE_MIDI_MIN = 48;
export const EAR_NOTE_MIDI_MAX = 72;

export interface EarNotePrompt {
  midi: number;
}

export function noteNameForMidi(midi: number): NoteName {
  return noteNameFromPitchClass(midi % 12);
}

/**
 * Human-readable pitch label, e.g. 60 → "C4", 61 → "C#/Db 4".
 * Accidentals keep the combined canonical form to stay consistent with the
 * answer grid labels.
 */
export function noteOctaveLabel(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = noteNameForMidi(midi);
  // Insert a space before the octave number for accidentals so it reads cleanly.
  return name.includes('/') ? `${name} ${octave}` : `${name}${octave}`;
}

export interface EarNoteConfig {
  noteSet: EarNoteSet;
}

function pitchClassesForSet(noteSet: EarNoteSet): number[] {
  const notes = noteSet === 'natural' ? naturalNotes : chromaticNotes;
  // Map note names back to pitch classes (C=0, ..., B=11)
  const nameToPC: Record<string, number> = {
    'C': 0, 'C#/Db': 1, 'D': 2, 'D#/Eb': 3, 'E': 4, 'F': 5,
    'F#/Gb': 6, 'G': 7, 'G#/Ab': 8, 'A': 9, 'A#/Bb': 10, 'B': 11,
  };
  return notes.map(n => nameToPC[n]);
}

export function generateEarNotePrompt(
  config: EarNoteConfig,
  rng: () => number = Math.random,
  previous?: EarNotePrompt,
): EarNotePrompt {
  const pitchClasses = pitchClassesForSet(config.noteSet);
  const previousPC = previous !== undefined ? previous.midi % 12 : -1;

  // Build the pool of valid MIDI numbers in range.
  const pool: number[] = [];
  for (let midi = EAR_NOTE_MIDI_MIN; midi <= EAR_NOTE_MIDI_MAX; midi++) {
    if (pitchClasses.includes(midi % 12)) pool.push(midi);
  }

  // Exclude the previous pitch class when the pool has alternatives.
  let candidates = pool;
  const alternatives = pool.filter(m => m % 12 !== previousPC);
  if (alternatives.length > 0) candidates = alternatives;

  const midi = candidates[Math.floor(rng() * candidates.length) % candidates.length];
  return { midi };
}
