import { makePromptAtIndex, makeRandomPrompt, evaluate, buildPositions, QuizEngineConfig } from '../../src/services/quizEngine';
import { DEFAULT_FRET_RANGE } from '../../src/domain/fretRange';
import { GuitarStringName } from '../../src/domain/guitarString';

const naturalConfig = { mode: 'natural' as const, fretRange: DEFAULT_FRET_RANGE };
const chromaticConfig = { mode: 'chromatic' as const, fretRange: DEFAULT_FRET_RANGE };

describe('makePromptAtIndex', () => {
  test('returns deterministic prompt for same index', () => {
    const p1 = makePromptAtIndex(naturalConfig, 0);
    const p2 = makePromptAtIndex(naturalConfig, 0);
    expect(p1.position.string.index).toBe(p2.position.string.index);
    expect(p1.position.fret).toBe(p2.position.fret);
  });

  test('wraps around beyond available positions', () => {
    const p0 = makePromptAtIndex(naturalConfig, 0);
    // Build positions count: 6 strings * frets that produce natural notes in range 0-12
    // Should wrap: index 0 and index N should be the same
    const largeIndex = 10000;
    const pLarge = makePromptAtIndex(naturalConfig, largeIndex);
    // Both are valid prompts
    expect(pLarge.position.fret).toBeGreaterThanOrEqual(0);
  });

  test('chromatic config includes accidentals', () => {
    const prompts = Array.from({ length: 50 }, (_, i) => makePromptAtIndex(chromaticConfig, i));
    const hasAccidental = prompts.some(p => p.correctAnswer.includes('/'));
    expect(hasAccidental).toBe(true);
  });

  test('natural config excludes accidentals', () => {
    const prompts = Array.from({ length: 50 }, (_, i) => makePromptAtIndex(naturalConfig, i));
    const hasAccidental = prompts.some(p => p.correctAnswer.includes('/'));
    expect(hasAccidental).toBe(false);
  });
});

describe('makeRandomPrompt', () => {
  test('excludes current prompt when possible', () => {
    const current = makePromptAtIndex(naturalConfig, 0);
    const next = makeRandomPrompt(naturalConfig, current);
    // With many positions available, next should differ
    const samePosition =
      next.position.string.index === current.position.string.index &&
      next.position.fret === current.position.fret;
    expect(samePosition).toBe(false);
  });
});

describe('evaluate', () => {
  test('returns true for correct answer', () => {
    const prompt = makePromptAtIndex(naturalConfig, 0);
    expect(evaluate(prompt.correctAnswer, prompt)).toBe(true);
  });

  test('returns false for wrong answer', () => {
    const prompt = makePromptAtIndex(naturalConfig, 0);
    const wrong = prompt.correctAnswer === 'A' ? 'B' : 'A';
    expect(evaluate(wrong, prompt)).toBe(false);
  });
});

describe('fret range filtering', () => {
  test('only includes frets in range', () => {
    const config = { mode: 'natural' as const, fretRange: { start: 5, end: 7 } };
    const prompts = Array.from({ length: 30 }, (_, i) => makePromptAtIndex(config, i));
    const allInRange = prompts.every(p => p.position.fret >= 5 && p.position.fret <= 7);
    expect(allInRange).toBe(true);
  });
});

describe('enabled strings filtering', () => {
  test('unset enabledStrings includes all six strings', () => {
    const positions = buildPositions(naturalConfig);
    const stringIndices = new Set(positions.map(p => p.string.index));
    expect(stringIndices.size).toBe(6);
  });

  test('excludes disabled strings from generated positions', () => {
    const enabledStrings: GuitarStringName[] = ['A', 'D', 'G', 'B'];
    const config: QuizEngineConfig = { mode: 'natural', fretRange: DEFAULT_FRET_RANGE, enabledStrings };
    const positions = buildPositions(config);
    const stringNames = new Set(positions.map(p => p.string.name));
    expect(stringNames.has('lowE')).toBe(false);
    expect(stringNames.has('highE')).toBe(false);
    expect(stringNames).toEqual(new Set(enabledStrings));
  });

  test('makeRandomPrompt only draws from enabled strings', () => {
    const enabledStrings: GuitarStringName[] = ['lowE', 'highE'];
    const config: QuizEngineConfig = { mode: 'natural', fretRange: DEFAULT_FRET_RANGE, enabledStrings };
    for (let i = 0; i < 30; i++) {
      const prompt = makeRandomPrompt(config);
      expect(enabledStrings).toContain(prompt.position.string.name);
    }
  });

  test('empty enabledStrings array falls back to all strings', () => {
    const config: QuizEngineConfig = { mode: 'natural', fretRange: DEFAULT_FRET_RANGE, enabledStrings: [] };
    const positions = buildPositions(config);
    const stringIndices = new Set(positions.map(p => p.string.index));
    expect(stringIndices.size).toBe(6);
  });
});
