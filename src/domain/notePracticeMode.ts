import { NoteName, naturalNotes, chromaticNotes } from './noteName';

export type NotePracticeMode = 'natural' | 'chromatic';

export const DEFAULT_PRACTICE_MODE: NotePracticeMode = 'natural';

export function answerChoices(mode: NotePracticeMode): NoteName[] {
  return mode === 'chromatic' ? chromaticNotes : naturalNotes;
}
