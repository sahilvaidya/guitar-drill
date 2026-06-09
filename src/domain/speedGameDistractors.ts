import { GUITAR_STRINGS } from './guitarString';
import { noteNameForMode } from './fretPosition';
import {
  NoteName, noteNameFromPitchClass, isNatural, naturalNotes, chromaticNotes,
} from './noteName';
import { NotePracticeMode } from './notePracticeMode';
import { QuizPrompt } from './quizPrompt';

const MAX_FRET = 12;
const NEARBY_FRET_SPAN = 2;

/**
 * Plausible wrong answers for a Speed Game prompt: notes physically nearby on
 * the fretboard (same or adjacent string, within ±2 frets) plus notes one or
 * two half-steps away from the correct answer.  Filtered to the practice
 * mode's note set; never contains the correct answer.
 */
export function distractorCandidates(
  prompt: QuizPrompt,
  mode: NotePracticeMode,
): NoteName[] {
  const { string, fret } = prompt.position;
  const candidates = new Set<NoteName>();

  for (let si = string.index - 1; si <= string.index + 1; si++) {
    if (si < 0 || si >= GUITAR_STRINGS.length) continue;
    for (let f = fret - NEARBY_FRET_SPAN; f <= fret + NEARBY_FRET_SPAN; f++) {
      if (f < 0 || f > MAX_FRET) continue;
      const note = noteNameForMode({ string: GUITAR_STRINGS[si], fret: f }, mode);
      if (note && note !== prompt.correctAnswer) candidates.add(note);
    }
  }

  const pc = string.openPitchClass + fret;
  for (const delta of [-2, -1, 1, 2]) {
    const note = noteNameFromPitchClass(pc + delta);
    if (mode === 'natural' && !isNatural(note)) continue;
    if (note !== prompt.correctAnswer) candidates.add(note);
  }

  return [...candidates];
}

/**
 * Pick two distinct wrong answers for the prompt.
 * @param rng injectable random source in [0, 1) for deterministic tests
 */
export function pickDistractors(
  prompt: QuizPrompt,
  mode: NotePracticeMode,
  rng: () => number = Math.random,
): [NoteName, NoteName] {
  const pool = distractorCandidates(prompt, mode);

  // Safety net: top up from the full note set (cannot trigger for standard
  // tuning, where nearby positions always yield ≥2 in-mode notes).
  if (pool.length < 2) {
    const all = mode === 'chromatic' ? chromaticNotes : naturalNotes;
    for (const n of all) {
      if (n !== prompt.correctAnswer && !pool.includes(n)) pool.push(n);
      if (pool.length >= 2) break;
    }
  }

  const first = pool[Math.floor(rng() * pool.length)];
  const rest = pool.filter(n => n !== first);
  const second = rest[Math.floor(rng() * rest.length)];
  return [first, second];
}
