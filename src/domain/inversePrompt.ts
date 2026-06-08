import { FretPosition } from './fretPosition';
import { NoteName } from './noteName';

export interface InversePrompt {
  targetNote: NoteName;
  displayNote: string;
  validPositions: FretPosition[];
}
