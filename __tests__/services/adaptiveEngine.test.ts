import { makeWeightedPrompt, missCountStrategy, WeightingStrategy } from '../../src/services/adaptiveEngine';
import { buildPositions } from '../../src/services/quizEngine';
import { fretPositionId } from '../../src/domain/fretPosition';
import { DEFAULT_FRET_RANGE } from '../../src/domain/fretRange';
import { RecentMiss } from '../../src/services/statsStore';

const naturalConfig = { mode: 'natural' as const, fretRange: DEFAULT_FRET_RANGE };
const noMisses: RecentMiss[] = [];

// Helper: key for a FretPosition-style miss
function missFor(stringIndex: number, fret: number): RecentMiss {
  return {
    position: { stringIndex, fret },
    correct: 'A',
    selected: 'B',
  };
}

describe('missCountStrategy', () => {
  test('returns weight 1 for all positions when no misses', () => {
    const positions = buildPositions(naturalConfig);
    const weights = missCountStrategy(positions, noMisses);
    expect(weights).toHaveLength(positions.length);
    expect(weights.every(w => w === 1)).toBe(true);
  });

  test('boosts weight for a missed position', () => {
    const positions = buildPositions(naturalConfig);
    const target = positions[0];
    const miss = missFor(target.string.index, target.fret);
    const weights = missCountStrategy(positions, [miss]);
    // weight for target should be > 1
    expect(weights[0]).toBeGreaterThan(1);
    // all other positions still have weight 1
    expect(weights.slice(1).every(w => w === 1)).toBe(true);
  });

  test('multiple misses on same position increase weight further', () => {
    const positions = buildPositions(naturalConfig);
    const target = positions[0];
    const miss = missFor(target.string.index, target.fret);
    const weights1 = missCountStrategy(positions, [miss]);
    const weights2 = missCountStrategy(positions, [miss, miss]);
    expect(weights2[0]).toBeGreaterThan(weights1[0]);
  });
});

describe('makeWeightedPrompt', () => {
  test('returns a valid prompt', () => {
    const prompt = makeWeightedPrompt(naturalConfig, noMisses);
    expect(prompt.position).toBeDefined();
    expect(prompt.correctAnswer).toBeDefined();
  });

  test('missed positions appear more frequently (statistical)', () => {
    const positions = buildPositions(naturalConfig);
    const target = positions[0];
    const miss = missFor(target.string.index, target.fret);
    const targetKey = fretPositionId(target);

    const SAMPLES = 400;
    let targetCount = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const prompt = makeWeightedPrompt(naturalConfig, [miss]);
      if (fretPositionId(prompt.position) === targetKey) targetCount++;
    }

    // uniform probability: 1/positions.length; miss gives 5× boost
    // expected boosted share ≈ 5 / (5 + positions.length - 1)
    // assert target appeared more than the uniform share
    const uniformExpected = SAMPLES / positions.length;
    expect(targetCount).toBeGreaterThan(uniformExpected * 1.5);
  });

  test('no-miss positions still appear when one position is heavily missed', () => {
    const positions = buildPositions(naturalConfig);
    const miss = missFor(positions[0].string.index, positions[0].fret);
    const seen = new Set<string>();

    for (let i = 0; i < 500; i++) {
      const prompt = makeWeightedPrompt(naturalConfig, [miss, miss, miss, miss, miss]);
      seen.add(fretPositionId(prompt.position));
    }

    // expect at least a handful of distinct non-missed positions to appear
    expect(seen.size).toBeGreaterThan(5);
  });

  test('exclude prevents the current position from repeating', () => {
    const current = makeWeightedPrompt(naturalConfig, noMisses);
    const currentKey = fretPositionId(current.position);

    for (let i = 0; i < 50; i++) {
      const next = makeWeightedPrompt(naturalConfig, noMisses, current);
      expect(fretPositionId(next.position)).not.toBe(currentKey);
    }
  });

  test('custom strategy is respected', () => {
    const positions = buildPositions(naturalConfig);
    const target = positions[3];

    // Strategy that gives all weight to positions[3], zero to everything else
    const alwaysTarget: WeightingStrategy = (ps) =>
      ps.map((p, i) => (i === 3 ? 100 : 0));

    for (let i = 0; i < 20; i++) {
      const prompt = makeWeightedPrompt(naturalConfig, noMisses, undefined, alwaysTarget);
      expect(fretPositionId(prompt.position)).toBe(fretPositionId(target));
    }
  });

  test('exclude + custom strategy: excluded position is zeroed out', () => {
    const positions = buildPositions(naturalConfig);
    const target = positions[3];
    const exclude = makeWeightedPrompt(naturalConfig, noMisses, undefined, () =>
      positions.map((_, i) => (i === 3 ? 100 : 0))
    );

    // exclude is the only high-weight position; fall back to last non-zero
    const alwaysTarget: WeightingStrategy = (ps) =>
      ps.map((_, i) => (i === 3 ? 100 : 1));

    const prompt = makeWeightedPrompt(naturalConfig, noMisses, exclude, alwaysTarget);
    expect(fretPositionId(prompt.position)).not.toBe(fretPositionId(target));
  });
});
