import { FretPosition, fretPositionId, noteNameForMode } from '@/domain/fretPosition';
import { NoteName } from '@/domain/noteName';
import { QuizPrompt } from '@/domain/quizPrompt';
import { RecentMiss } from './statsStore';
import { QuizEngineConfig, buildPositions } from './quizEngine';

// ── Strategy interface ─────────────────────────────────────────────────────
// Maps (positions, recentMisses) → parallel weight array.
// All weights must be ≥ 0; at least one must be > 0.
// Swap in any function with this signature to change the selection algorithm.
export type WeightingStrategy = (
  positions: FretPosition[],
  recentMisses: RecentMiss[]
) => number[];

// ── Built-in strategies ────────────────────────────────────────────────────

const MISS_BOOST = 4;

// Default: each miss adds MISS_BOOST to a position's base weight of 1.
// missCount=0 → weight 1; missCount=1 → weight 5; missCount=2 → weight 9.
export const missCountStrategy: WeightingStrategy = (
  positions,
  recentMisses
): number[] => {
  const missCount = new Map<string, number>();
  for (const miss of recentMisses) {
    const key = `${miss.position.stringIndex}-${miss.position.fret}`;
    missCount.set(key, (missCount.get(key) ?? 0) + 1);
  }
  return positions.map(pos => {
    const count = missCount.get(fretPositionId(pos)) ?? 0;
    return 1 + count * MISS_BOOST;
  });
};

// ── Weighted sampler ───────────────────────────────────────────────────────

function weightedSample(positions: FretPosition[], weights: number[]): FretPosition {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < positions.length; i++) {
    r -= weights[i];
    if (r <= 0) return positions[i];
  }
  return positions[positions.length - 1];
}

// ── Public API ─────────────────────────────────────────────────────────────

export function makeWeightedPrompt(
  config: QuizEngineConfig,
  recentMisses: RecentMiss[],
  exclude?: QuizPrompt,
  strategy: WeightingStrategy = missCountStrategy
): QuizPrompt {
  const positions = buildPositions(config);
  if (positions.length === 0) throw new Error('No playable positions for current config');

  const weights = strategy(positions, recentMisses);

  // Zero out the excluded position so it can't be selected (when alternatives exist)
  if (exclude && positions.length > 1) {
    for (let i = 0; i < positions.length; i++) {
      if (
        positions[i].string.index === exclude.position.string.index &&
        positions[i].fret === exclude.position.fret
      ) {
        weights[i] = 0;
        break;
      }
    }
  }

  const pos = weightedSample(positions, weights);
  return { position: pos, correctAnswer: noteNameForMode(pos, config.mode) as NoteName };
}
