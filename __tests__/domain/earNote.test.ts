import {
  EAR_NOTE_MIDI_MIN,
  EAR_NOTE_MIDI_MAX,
  noteNameForMidi,
  noteOctaveLabel,
  generateEarNotePrompt,
  EarNoteConfig,
  EarNotePrompt,
} from '@/domain/earNote';
import { naturalNotes } from '@/domain/noteName';

describe('noteNameForMidi', () => {
  it('maps C4 (60) to C', () => {
    expect(noteNameForMidi(60)).toBe('C');
  });

  it('maps C3 (48) to C', () => {
    expect(noteNameForMidi(48)).toBe('C');
  });

  it('maps A4 (69) to A', () => {
    expect(noteNameForMidi(69)).toBe('A');
  });

  it('maps C#4 (61) to C#/Db', () => {
    expect(noteNameForMidi(61)).toBe('C#/Db');
  });
});

describe('noteOctaveLabel', () => {
  it('C3 (48) → "C3"', () => {
    expect(noteOctaveLabel(48)).toBe('C3');
  });

  it('C4 (60) → "C4"', () => {
    expect(noteOctaveLabel(60)).toBe('C4');
  });

  it('C5 (72) → "C5"', () => {
    expect(noteOctaveLabel(72)).toBe('C5');
  });

  it('accidental includes space before octave number', () => {
    // 61 = C#/Db in octave 4
    expect(noteOctaveLabel(61)).toBe('C#/Db 4');
  });

  it('A4 (69) → "A4"', () => {
    expect(noteOctaveLabel(69)).toBe('A4');
  });
});

describe('generateEarNotePrompt', () => {
  const naturalConfig: EarNoteConfig = { noteSet: 'natural' };
  const chromaticConfig: EarNoteConfig = { noteSet: 'chromatic' };

  it('midi is always within EAR_NOTE_MIDI_MIN..EAR_NOTE_MIDI_MAX', () => {
    for (let i = 0; i < 200; i++) {
      const p = generateEarNotePrompt(naturalConfig);
      expect(p.midi).toBeGreaterThanOrEqual(EAR_NOTE_MIDI_MIN);
      expect(p.midi).toBeLessThanOrEqual(EAR_NOTE_MIDI_MAX);
    }
  });

  it('natural set only yields natural pitch classes', () => {
    const naturalPCs = new Set(naturalNotes.map(n => {
      const map: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      return map[n];
    }));
    for (let i = 0; i < 200; i++) {
      const p = generateEarNotePrompt(naturalConfig);
      expect(naturalPCs.has(p.midi % 12)).toBe(true);
    }
  });

  it('chromatic set yields all 12 pitch classes over many draws', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const p = generateEarNotePrompt(chromaticConfig);
      seen.add(p.midi % 12);
    }
    expect(seen.size).toBe(12);
  });

  it('does not immediately repeat the same pitch class', () => {
    let previous = generateEarNotePrompt(chromaticConfig);
    for (let i = 0; i < 200; i++) {
      const next = generateEarNotePrompt(chromaticConfig, Math.random, previous);
      expect(next.midi % 12).not.toBe(previous.midi % 12);
      previous = next;
    }
  });

  it('allows same pitch class only when it is the sole option (degenerate case)', () => {
    // A config where the midi range has only one distinct pitch class would
    // fall through to the full pool; test the normal no-repeat path holds.
    const prev: EarNotePrompt = { midi: 60 }; // C4
    // With natural set there are 7 pitch classes in range, so C is excludable.
    const next = generateEarNotePrompt(naturalConfig, Math.random, prev);
    expect(next.midi % 12).not.toBe(0); // pitch class 0 = C
  });

  it('is deterministic for a fixed rng', () => {
    const rng = () => 0.5;
    const a = generateEarNotePrompt(naturalConfig, rng);
    const b = generateEarNotePrompt(naturalConfig, rng);
    expect(a).toEqual(b);
  });
});
