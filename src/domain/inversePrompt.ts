import { FretPosition } from './fretPosition';
import { GuitarStringDef } from './guitarString';
import { NoteName } from './noteName';

export interface InversePrompt {
  targetNote: NoteName;
  displayNote: string;
  targetPosition: FretPosition;
  windowStrings: GuitarStringDef[];  // 3 strings, ascending by index
  windowFrets: number[];              // 4 consecutive frets
}
