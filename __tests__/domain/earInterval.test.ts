import {
  ALL_INTERVALS,
  INTERVAL_SEMITONES,
  INTERVAL_FULL_NAMES,
  INTERVAL_SONG_HINTS,
  LEVEL_INTERVALS,
  EAR_MIDI_MIN,
  EAR_MIDI_MAX,
  EarIntervalPrompt,
  generateEarIntervalPrompt,
  secondMidi,
} from '@/domain/earInterval';

/** rng stub that replays a fixed sequence, then repeats the last value. */
function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('interval tables', () => {
  it('maps all 12 intervals to 1..12 semitones in order', () => {
    expect(ALL_INTERVALS).toHaveLength(12);
    ALL_INTERVALS.forEach((interval, idx) => {
      expect(INTERVAL_SEMITONES[interval]).toBe(idx + 1);
    });
  });

  it('has a full name and a song hint for every interval', () => {
    for (const interval of ALL_INTERVALS) {
      expect(INTERVAL_FULL_NAMES[interval]).toBeTruthy();
      expect(INTERVAL_SONG_HINTS[interval]).toBeTruthy();
    }
  });

  it('levels are nested subsets of the chromatic set', () => {
    const beginner = new Set(LEVEL_INTERVALS.beginner);
    const intermediate = new Set(LEVEL_INTERVALS.intermediate);
    for (const i of beginner) expect(intermediate.has(i)).toBe(true);
    for (const i of intermediate) expect(ALL_INTERVALS).toContain(i);
    expect(LEVEL_INTERVALS.advanced).toEqual(ALL_INTERVALS);
  });
});

describe('secondMidi', () => {
  it('adds semitones for ascending prompts', () => {
    const prompt: EarIntervalPrompt = { interval: 'P5', direction: 'ascending', rootMidi: 50 };
    expect(secondMidi(prompt)).toBe(57);
  });

  it('subtracts semitones for descending prompts', () => {
    const prompt: EarIntervalPrompt = { interval: 'M3', direction: 'descending', rootMidi: 60 };
    expect(secondMidi(prompt)).toBe(56);
  });

  it('adds semitones for harmonic prompts (root is the lower note)', () => {
    const prompt: EarIntervalPrompt = { interval: 'P8', direction: 'harmonic', rootMidi: 45 };
    expect(secondMidi(prompt)).toBe(57);
  });
});

describe('generateEarIntervalPrompt', () => {
  it('only picks intervals from the selected level', () => {
    for (let i = 0; i < 100; i++) {
      const prompt = generateEarIntervalPrompt({ direction: 'ascending', level: 'beginner' });
      expect(LEVEL_INTERVALS.beginner).toContain(prompt.interval);
    }
  });

  it('keeps both notes inside the guitar register for every direction', () => {
    const directions = ['ascending', 'descending', 'harmonic', 'mixed'] as const;
    for (const direction of directions) {
      for (let i = 0; i < 200; i++) {
        const prompt = generateEarIntervalPrompt({ direction, level: 'advanced' });
        expect(prompt.rootMidi).toBeGreaterThanOrEqual(EAR_MIDI_MIN);
        expect(prompt.rootMidi).toBeLessThanOrEqual(EAR_MIDI_MAX);
        expect(secondMidi(prompt)).toBeGreaterThanOrEqual(EAR_MIDI_MIN);
        expect(secondMidi(prompt)).toBeLessThanOrEqual(EAR_MIDI_MAX);
      }
    }
  });

  it('uses the fixed direction setting verbatim', () => {
    const prompt = generateEarIntervalPrompt({ direction: 'descending', level: 'beginner' });
    expect(prompt.direction).toBe('descending');
  });

  it('mixed direction resolves to a concrete direction per prompt', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const prompt = generateEarIntervalPrompt({ direction: 'mixed', level: 'beginner' });
      expect(['ascending', 'descending', 'harmonic']).toContain(prompt.direction);
      seen.add(prompt.direction);
    }
    expect(seen.size).toBe(3);
  });

  it('never repeats the previous interval when the pool has alternatives', () => {
    let previous = generateEarIntervalPrompt({ direction: 'ascending', level: 'beginner' });
    for (let i = 0; i < 100; i++) {
      const next = generateEarIntervalPrompt(
        { direction: 'ascending', level: 'beginner' }, Math.random, previous,
      );
      expect(next.interval).not.toBe(previous.interval);
      previous = next;
    }
  });

  it('is deterministic for a fixed rng', () => {
    const a = generateEarIntervalPrompt({ direction: 'ascending', level: 'beginner' }, seqRng([0.2, 0.4]));
    const b = generateEarIntervalPrompt({ direction: 'ascending', level: 'beginner' }, seqRng([0.2, 0.4]));
    expect(a).toEqual(b);
  });
});
