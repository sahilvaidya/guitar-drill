import { FretPosition, fretPositionId } from './fretPosition';
import { NoteName } from './noteName';

export interface QuizPrompt {
  position: FretPosition;
  correctAnswer: NoteName;
}

export function quizPromptId(prompt: QuizPrompt): string {
  return fretPositionId(prompt.position);
}
