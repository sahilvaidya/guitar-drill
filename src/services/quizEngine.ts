import { GUITAR_STRINGS } from '@/domain/guitarString';
import { FretPosition, noteNameForMode } from '@/domain/fretPosition';
import { FretRange, fretRangeToArray } from '@/domain/fretRange';
import { NotePracticeMode } from '@/domain/notePracticeMode';
import { QuizPrompt } from '@/domain/quizPrompt';
import { NoteName } from '@/domain/noteName';

export interface QuizEngineConfig {
  mode: NotePracticeMode;
  fretRange: FretRange;
}

function buildPositions(config: QuizEngineConfig): FretPosition[] {
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
