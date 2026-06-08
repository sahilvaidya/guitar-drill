import { GUITAR_STRINGS } from '@/domain/guitarString';
import { FretPosition, noteNameForMode, getAllPositionsForNote, chromaticNoteName } from '@/domain/fretPosition';
import { FretRange, fretRangeToArray } from '@/domain/fretRange';
import { NotePracticeMode } from '@/domain/notePracticeMode';
import { QuizPrompt } from '@/domain/quizPrompt';
import { NoteName, naturalNotes, chromaticNotes, AccidentalDisplay, displayNoteForAccidental, noteNameFromPitchClass } from '@/domain/noteName';
import { InversePrompt } from '@/domain/inversePrompt';
import { GuitarStringDef } from '@/domain/guitarString';

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

// ── Inverse drill helpers ──────────────────────────────────────────────────

const MAX_FRET = 12;
const INVERSE_MISS_BOOST = 4;

function findUniqueWindow(
  targetNote: NoteName,
  targetPos: FretPosition,
): { windowStrings: GuitarStringDef[]; windowFrets: number[] } | null {
  const sIdx = targetPos.string.index;
  const fret = targetPos.fret;

  // Build candidate string groups (3 consecutive strings that include target).
  // Prefer {S-1, S, S+1} first — adjacent strings are always ≥4 semitones apart
  // so collisions within a 4-fret window are impossible for those.
  const seen = new Set<string>();
  const stringGroups: GuitarStringDef[][] = [];
  const addGroup = (indices: number[]) => {
    const key = indices.join(',');
    if (!seen.has(key)) { seen.add(key); stringGroups.push(indices.map(i => GUITAR_STRINGS[i])); }
  };

  if (sIdx >= 1 && sIdx <= 4) addGroup([sIdx - 1, sIdx, sIdx + 1]);
  if (sIdx >= 2)               addGroup([sIdx - 2, sIdx - 1, sIdx]);
  if (sIdx <= 3)               addGroup([sIdx, sIdx + 1, sIdx + 2]);
  if (sIdx === 0)              addGroup([0, 1, 2]);
  if (sIdx === 5)              addGroup([3, 4, 5]);

  // Candidate fret windows: all 4-fret spans [W, W+3] that contain `fret`
  const fretCandidates: number[][] = [];
  const minW = Math.max(0, fret - 3);
  const maxW = Math.min(MAX_FRET - 3, fret);
  for (let w = minW; w <= maxW; w++) fretCandidates.push([w, w + 1, w + 2, w + 3]);

  for (const group of stringGroups) {
    for (const windowFrets of fretCandidates) {
      let count = 0;
      for (const s of group) {
        for (const f of windowFrets) {
          if (noteNameFromPitchClass((s.openPitchClass + f) % 12) === targetNote) count++;
        }
      }
      if (count === 1) return { windowStrings: group, windowFrets };
    }
  }
  return null;
}

function buildInversePrompt(
  note: NoteName,
  config: QuizEngineConfig,
  accidentalDisplay: AccidentalDisplay,
): InversePrompt | null {
  const positions = getAllPositionsForNote(note, config.fretRange);
  // Shuffle so we don't always pick the same position
  const shuffled = [...positions].sort(() => Math.random() - 0.5);
  for (const pos of shuffled) {
    const win = findUniqueWindow(note, pos);
    if (win) {
      return {
        targetNote: note,
        displayNote: displayNoteForAccidental(note, accidentalDisplay),
        targetPosition: pos,
        windowStrings: win.windowStrings,
        windowFrets: win.windowFrets,
      };
    }
  }
  return null;
}

export function generateInversePrompt(
  config: QuizEngineConfig,
  missedNotes: NoteName[],
  accidentalDisplay: AccidentalDisplay,
  exclude?: NoteName,
): InversePrompt | null {
  const noteSet: NoteName[] = config.mode === 'chromatic' ? chromaticNotes : naturalNotes;

  const missCount = new Map<NoteName, number>();
  for (const n of missedNotes) missCount.set(n, (missCount.get(n) ?? 0) + 1);

  // Filter to notes that have at least one uniquely-windowable position
  const candidates = noteSet.filter(n => {
    const positions = getAllPositionsForNote(n, config.fretRange);
    return positions.some(pos => findUniqueWindow(n, pos) !== null);
  });
  if (candidates.length === 0) return null;

  const weights = candidates.map(n => {
    const base = (exclude === n && candidates.length > 1) ? 0 : 1;
    return base + (missCount.get(n) ?? 0) * INVERSE_MISS_BOOST;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * (total || candidates.length);
  let chosen = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i++) {
    r -= total ? weights[i] : 1;
    if (r <= 0) { chosen = candidates[i]; break; }
  }

  return buildInversePrompt(chosen, config, accidentalDisplay);
}
