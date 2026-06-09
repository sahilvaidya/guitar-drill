import { FretPosition } from './fretPosition';

/**
 * Chord detection for the Chord Detector tool.
 *
 * Matches a set of selected fretboard positions against the essential chord
 * qualities.  Voicings are compared as pitch-class sets (octaves and doubled
 * notes ignored); the lowest sounding note decides slash naming (e.g. C/E).
 */

export type ChordQuality =
  | 'major' | 'minor' | 'dim' | 'sus2' | 'sus4'
  | 'dom7' | 'maj7' | 'min7' | 'dim7';

interface ChordTemplate {
  quality: ChordQuality;
  /** Semitones from root. */
  intervals: number[];
  /** Seventh chords are still recognizable when the fifth is left out. */
  omittableFifth: boolean;
}

const TEMPLATES: ChordTemplate[] = [
  { quality: 'major', intervals: [0, 4, 7],     omittableFifth: false },
  { quality: 'minor', intervals: [0, 3, 7],     omittableFifth: false },
  { quality: 'sus2',  intervals: [0, 2, 7],     omittableFifth: false },
  { quality: 'sus4',  intervals: [0, 5, 7],     omittableFifth: false },
  { quality: 'dim',   intervals: [0, 3, 6],     omittableFifth: false },
  { quality: 'dom7',  intervals: [0, 4, 7, 10], omittableFifth: true  },
  { quality: 'maj7',  intervals: [0, 4, 7, 11], omittableFifth: true  },
  { quality: 'min7',  intervals: [0, 3, 7, 10], omittableFifth: true  },
  { quality: 'dim7',  intervals: [0, 3, 6, 9],  omittableFifth: false },
];

export const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  major: '', minor: 'm', dim: 'dim', sus2: 'sus2', sus4: 'sus4',
  dom7: '7', maj7: 'maj7', min7: 'm7', dim7: 'dim7',
};

export const QUALITY_LABEL: Record<ChordQuality, string> = {
  major: 'Major', minor: 'Minor', dim: 'Diminished',
  sus2: 'Suspended 2nd', sus4: 'Suspended 4th',
  dom7: 'Dominant 7th', maj7: 'Major 7th', min7: 'Minor 7th',
  dim7: 'Diminished 7th',
};

/** Conventional chord-root spellings: C# and F# sharp, the rest of the accidentals flat. */
const ROOT_DISPLAY = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export function pitchDisplayName(pitchClass: number): string {
  return ROOT_DISPLAY[((pitchClass % 12) + 12) % 12];
}

export interface ChordMatch {
  rootPc: number;
  bassPc: number;
  quality: ChordQuality;
  /** True for shell voicings where the fifth is omitted. */
  omittedFifth: boolean;
}

/** Chord symbol, e.g. "C", "Am7", "F#dim7", "C/E". */
export function chordSymbol(match: ChordMatch): string {
  const root = pitchDisplayName(match.rootPc) + QUALITY_SUFFIX[match.quality];
  if (match.bassPc !== match.rootPc) return `${root}/${pitchDisplayName(match.bassPc)}`;
  return root;
}

function setEquals(a: Set<number>, b: number[]): boolean {
  return a.size === b.length && b.every(x => a.has(x));
}

/**
 * All chord interpretations of a pitch-class set, best first.
 *
 * Ranking: interpretations rooted on the bass note beat slash readings,
 * complete voicings beat shell voicings, then template order (triads
 * before sevenths) breaks remaining ties.
 */
export function detectChords(pitchClasses: number[], bassPc: number): ChordMatch[] {
  const pcs = [...new Set(pitchClasses.map(pc => ((pc % 12) + 12) % 12))];
  const bass = ((bassPc % 12) + 12) % 12;
  if (pcs.length < 3) return [];

  const matches: ChordMatch[] = [];
  for (const root of pcs) {
    const intervals = new Set(pcs.map(pc => ((pc - root) + 12) % 12));
    for (const t of TEMPLATES) {
      if (setEquals(intervals, t.intervals)) {
        matches.push({ rootPc: root, bassPc: bass, quality: t.quality, omittedFifth: false });
      } else if (t.omittableFifth && setEquals(intervals, t.intervals.filter(i => i !== 7))) {
        matches.push({ rootPc: root, bassPc: bass, quality: t.quality, omittedFifth: true });
      }
    }
  }

  const templateOrder = (q: ChordQuality) => TEMPLATES.findIndex(t => t.quality === q);
  matches.sort((a, b) =>
    (a.rootPc === bass ? 0 : 1) - (b.rootPc === bass ? 0 : 1) ||
    (a.omittedFifth ? 1 : 0) - (b.omittedFifth ? 1 : 0) ||
    templateOrder(a.quality) - templateOrder(b.quality),
  );
  return matches;
}

// ── Fretboard helpers ────────────────────────────────────────────────────────

/** Open-string pitches in semitones (MIDI), low E → high e: E2 A2 D3 G3 B3 E4. */
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

export function absolutePitch(pos: FretPosition): number {
  return OPEN_STRING_MIDI[pos.string.index] + pos.fret;
}

/** Detect chords from selected fretboard positions; the lowest note is the bass. */
export function detectFromPositions(positions: FretPosition[]): ChordMatch[] {
  if (positions.length === 0) return [];
  const pcs = positions.map(p => (p.string.openPitchClass + p.fret) % 12);
  const bass = positions.reduce((lo, p) => (absolutePitch(p) < absolutePitch(lo) ? p : lo));
  return detectChords(pcs, (bass.string.openPitchClass + bass.fret) % 12);
}
