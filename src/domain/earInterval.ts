// Ear training: interval recognition domain logic. Pure TS, no RN deps.

export type IntervalName =
  | 'm2' | 'M2' | 'm3' | 'M3' | 'P4' | 'TT'
  | 'P5' | 'm6' | 'M6' | 'm7' | 'M7' | 'P8';

export const ALL_INTERVALS: IntervalName[] = [
  'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8',
];

export const INTERVAL_SEMITONES: Record<IntervalName, number> = {
  m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, TT: 6,
  P5: 7, m6: 8, M6: 9, m7: 10, M7: 11, P8: 12,
};

export const INTERVAL_FULL_NAMES: Record<IntervalName, string> = {
  m2: 'Minor 2nd',
  M2: 'Major 2nd',
  m3: 'Minor 3rd',
  M3: 'Major 3rd',
  P4: 'Perfect 4th',
  TT: 'Tritone',
  P5: 'Perfect 5th',
  m6: 'Minor 6th',
  M6: 'Major 6th',
  m7: 'Minor 7th',
  M7: 'Major 7th',
  P8: 'Octave',
};

/** Classic reference melodies (ascending) shown after a correct answer. */
export const INTERVAL_SONG_HINTS: Record<IntervalName, string> = {
  m2: 'Jaws theme',
  M2: 'Happy Birthday',
  m3: 'Greensleeves',
  M3: 'Oh When the Saints',
  P4: 'Here Comes the Bride',
  TT: 'The Simpsons theme',
  P5: 'Star Wars theme',
  m6: 'The Entertainer',
  M6: 'My Bonnie Lies over the Ocean',
  m7: 'Star Trek (original) theme',
  M7: 'Take On Me (chorus leap)',
  P8: 'Somewhere Over the Rainbow',
};

/** How the two notes are played. 'mixed' resolves to one of the others per prompt. */
export type EarDirection = 'ascending' | 'descending' | 'harmonic';
export type EarDirectionSetting = EarDirection | 'mixed';

export const DIRECTION_SETTINGS: EarDirectionSetting[] = [
  'ascending', 'descending', 'harmonic', 'mixed',
];

export type EarLevel = 'beginner' | 'intermediate' | 'advanced';

export const EAR_LEVELS: EarLevel[] = ['beginner', 'intermediate', 'advanced'];

export const LEVEL_INTERVALS: Record<EarLevel, IntervalName[]> = {
  beginner: ['M2', 'M3', 'P4', 'P5', 'P8'],
  intermediate: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'],
  advanced: ALL_INTERVALS,
};

export const DEFAULT_EAR_DIRECTION: EarDirectionSetting = 'ascending';
export const DEFAULT_EAR_LEVEL: EarLevel = 'beginner';

// Guitar-register pitch bounds: E2 (open low E) to E5 (12th fret high e)
export const EAR_MIDI_MIN = 40;
export const EAR_MIDI_MAX = 76;

export interface EarIntervalPrompt {
  interval: IntervalName;
  /** Resolved playback direction (never 'mixed'). */
  direction: EarDirection;
  /** MIDI number of the first played note (the lower note when harmonic). */
  rootMidi: number;
}

/** MIDI number of the second note implied by the prompt. */
export function secondMidi(prompt: EarIntervalPrompt): number {
  const semis = INTERVAL_SEMITONES[prompt.interval];
  return prompt.direction === 'descending'
    ? prompt.rootMidi - semis
    : prompt.rootMidi + semis;
}

export interface EarPromptConfig {
  direction: EarDirectionSetting;
  level: EarLevel;
}

function resolveDirection(setting: EarDirectionSetting, rng: () => number): EarDirection {
  if (setting !== 'mixed') return setting;
  const options: EarDirection[] = ['ascending', 'descending', 'harmonic'];
  return options[Math.floor(rng() * options.length) % options.length];
}

export function generateEarIntervalPrompt(
  config: EarPromptConfig,
  rng: () => number = Math.random,
  previous?: EarIntervalPrompt,
): EarIntervalPrompt {
  const pool = LEVEL_INTERVALS[config.level];
  let candidates = pool;
  if (previous && pool.length > 1) {
    candidates = pool.filter(i => i !== previous.interval);
  }
  const interval = candidates[Math.floor(rng() * candidates.length) % candidates.length];
  const direction = resolveDirection(config.direction, rng);
  const semis = INTERVAL_SEMITONES[interval];

  // Pick a root so both notes stay inside the guitar register.
  const lo = direction === 'descending' ? EAR_MIDI_MIN + semis : EAR_MIDI_MIN;
  const hi = direction === 'descending' ? EAR_MIDI_MAX : EAR_MIDI_MAX - semis;
  const rootMidi = lo + Math.floor(rng() * (hi - lo + 1)) % (hi - lo + 1);

  return { interval, direction, rootMidi };
}
