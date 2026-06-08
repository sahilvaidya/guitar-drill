import { GUITAR_STRINGS } from '@/domain/guitarString';
import { FretPosition, noteNameForMode, getAllPositionsForNote } from '@/domain/fretPosition';
import { FretRange, fretRangeToArray } from '@/domain/fretRange';
import { NotePracticeMode } from '@/domain/notePracticeMode';
import { QuizPrompt } from '@/domain/quizPrompt';
import { NoteName, naturalNotes, chromaticNotes, AccidentalDisplay, displayNoteForAccidental } from '@/domain/noteName';
import { InversePrompt } from '@/domain/inversePrompt';

export interface QuizEngineConfig {
  mode: NotePracticeMode;
  fretRange: FretRange;
}

export function buildPositions(config: QuizEngineConfig): FretPosition[] {
  const frets = fretRangeToArray(config.fretRange);
  const positions: FretPosition[] = [];
  for (const string of GUITAR_STRINGS) {
    for (const fret of frets) {
      const pos: FretPosition = { string, fret };
      if (noteNameForMode(pos, config.mode) !== null) {
        positions.push(pos);
      }
    }
  }
  return positions;
}

export function makePromptAtIndex(config: QuizEngineConfig, index: number): QuizPrompt {
  const positions = buildPositions(config);
  if (positions.length === 0) throw new Error('No playable positions for current config');
  const pos = positions[index % positions.length];
  return { position: pos, correctAnswer: noteNameForMode(pos, config.mode) as NoteName };
}

export function makeRandomPrompt(config: QuizEngineConfig, exclude?: QuizPrompt): QuizPrompt {
  const positions = buildPositions(config);
  if (positions.length === 0) throw new Error('No playable positions for current config');

  let candidates = positions;
  if (exclude && positions.length > 1) {
    candidates = positions.filter(
      p => !(p.string.index === exclude.position.string.index && p.fret === exclude.position.fret)
    );
  }

  const pos = candidates[Math.floor(Math.random() * candidates.length)];
  return { position: pos, correctAnswer: noteNameForMode(pos, config.mode) as NoteName };
}

export function evaluate(answer: NoteName, prompt: QuizPrompt): boolean {
  return answer === prompt.correctAnswer;
}

const INVERSE_MISS_BOOST = 4;

export function generateInversePrompt(
  config: QuizEngineConfig,
  missedNotes: NoteName[],
  accidentalDisplay: AccidentalDisplay,
  exclude?: NoteName,
): InversePrompt | null {
  const noteSet: NoteName[] = config.mode === 'chromatic' ? chromaticNotes : naturalNotes;
  const candidates = noteSet.filter(n => getAllPositionsForNote(n, config.fretRange).length > 0);
  if (candidates.length === 0) return null;

  const missCount = new Map<NoteName, number>();
  for (const n of missedNotes) missCount.set(n, (missCount.get(n) ?? 0) + 1);

  const weights = candidates.map(n => {
    const base = exclude === n && candidates.length > 1 ? 0 : 1;
    return base + (missCount.get(n) ?? 0) * INVERSE_MISS_BOOST;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let chosen = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) { chosen = candidates[i]; break; }
  }

  return {
    targetNote: chosen,
    displayNote: displayNoteForAccidental(chosen, accidentalDisplay),
    validPositions: getAllPositionsForNote(chosen, config.fretRange),
  };
}
