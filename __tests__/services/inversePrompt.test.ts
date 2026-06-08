import { generateInversePrompt } from '../../src/services/quizEngine';
import { DEFAULT_FRET_RANGE, FretRange } from '../../src/domain/fretRange';
import { NoteName, naturalNotes } from '../../src/domain/noteName';
import { QuizEngineConfig } from '../../src/services/quizEngine';

const naturalConfig: QuizEngineConfig = { mode: 'natural', fretRange: DEFAULT_FRET_RANGE };
const chromaticConfig: QuizEngineConfig = { mode: 'chromatic', fretRange: DEFAULT_FRET_RANGE };

describe('generateInversePrompt', () => {
  it('returns a prompt with a target position and a 3×4 window', () => {
    const prompt = generateInversePrompt(naturalConfig, [], 'sharp');
    expect(prompt).not.toBeNull();
    expect(prompt!.windowStrings).toHaveLength(3);
    expect(prompt!.windowFrets).toHaveLength(4);
    // Target position must be inside the window
    expect(prompt!.windowStrings.map(s => s.index)).toContain(prompt!.targetPosition.string.index);
    expect(prompt!.windowFrets).toContain(prompt!.targetPosition.fret);
  });

  it('targetNote is a natural note in natural mode', () => {
    for (let i = 0; i < 20; i++) {
      const prompt = generateInversePrompt(naturalConfig, [], 'sharp');
      expect(naturalNotes).toContain(prompt!.targetNote);
    }
  });

  it('displayNote uses sharp spelling in chromatic mode with sharp display', () => {
    // Run many times to find an accidental note
    let sawAccidentalSharp = false;
    for (let i = 0; i < 100; i++) {
      const prompt = generateInversePrompt(chromaticConfig, [], 'sharp');
      if (prompt!.targetNote.includes('/')) {
        expect(prompt!.displayNote).not.toContain('/');
        expect(prompt!.displayNote).toContain('#');
        sawAccidentalSharp = true;
        break;
      }
    }
    expect(sawAccidentalSharp).toBe(true);
  });

  it('displayNote uses flat spelling in chromatic mode with flat display', () => {
    let sawAccidentalFlat = false;
    for (let i = 0; i < 100; i++) {
      const prompt = generateInversePrompt(chromaticConfig, [], 'flat');
      if (prompt!.targetNote.includes('/')) {
        expect(prompt!.displayNote).not.toContain('#');
        expect(prompt!.displayNote).toMatch(/b$/);
        sawAccidentalFlat = true;
        break;
      }
    }
    expect(sawAccidentalFlat).toBe(true);
  });

  it('displayNote matches targetNote for natural notes', () => {
    for (let i = 0; i < 30; i++) {
      const prompt = generateInversePrompt(naturalConfig, [], 'sharp');
      if (!prompt!.targetNote.includes('/')) {
        expect(prompt!.displayNote).toBe(prompt!.targetNote);
      }
    }
  });

  it('skips excluded note when other notes are available', () => {
    const counts = new Map<NoteName, number>();
    for (let i = 0; i < 50; i++) {
      const prompt = generateInversePrompt(naturalConfig, [], 'sharp', 'A');
      const note = prompt!.targetNote;
      counts.set(note, (counts.get(note) ?? 0) + 1);
    }
    expect(counts.get('A') ?? 0).toBe(0);
  });

  it('only returns notes that have at least one position in a narrow fret range', () => {
    // Fret 1 in natural mode: only F (lowE) and C (B string) and F (highE) are natural
    const narrowRange: FretRange = { start: 1, end: 1 };
    const validNaturals = new Set<NoteName>();
    for (let i = 0; i < 50; i++) {
      const prompt = generateInversePrompt({ mode: 'natural', fretRange: narrowRange }, [], 'sharp');
      expect(prompt).not.toBeNull();
      validNaturals.add(prompt!.targetNote);
    }
    // Only natural notes with positions at fret 1 should appear
    for (const note of validNaturals) {
      const positions = require('../../src/domain/fretPosition').getAllPositionsForNote(note, narrowRange);
      expect(positions.length).toBeGreaterThan(0);
    }
  });

  it('targetPosition belongs to the targetNote', () => {
    for (let i = 0; i < 10; i++) {
      const prompt = generateInversePrompt(naturalConfig, [], 'sharp');
      const pos = prompt!.targetPosition;
      const pitchClass = (pos.string.openPitchClass + pos.fret) % 12;
      const noteForPos = (['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'] as NoteName[])[pitchClass];
      expect(noteForPos).toBe(prompt!.targetNote);
    }
  });

  it('window contains exactly one occurrence of the targetNote', () => {
    for (let i = 0; i < 20; i++) {
      const prompt = generateInversePrompt(naturalConfig, [], 'sharp');
      let count = 0;
      for (const s of prompt!.windowStrings) {
        for (const f of prompt!.windowFrets) {
          const pitchClass = (s.openPitchClass + f) % 12;
          const noteForPos = (['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'] as NoteName[])[pitchClass];
          if (noteForPos === prompt!.targetNote) count++;
        }
      }
      expect(count).toBe(1);
    }
  });

  it('boosts missed notes in selection', () => {
    const missedNotes: NoteName[] = Array(10).fill('A');
    const counts = new Map<NoteName, number>();
    for (let i = 0; i < 100; i++) {
      const prompt = generateInversePrompt(naturalConfig, missedNotes, 'sharp');
      const note = prompt!.targetNote;
      counts.set(note, (counts.get(note) ?? 0) + 1);
    }
    // A should appear significantly more than other notes due to boost
    const aCount = counts.get('A') ?? 0;
    const avgOtherCount = (100 - aCount) / 6; // 7 natural notes, excluding A
    expect(aCount).toBeGreaterThan(avgOtherCount * 2);
  });
});
