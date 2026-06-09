import {
  OPEN_CHORDS, OPEN_SEVENTH_CHORDS, SUS_CHORDS,
  BARRE_6TH_SHAPES, BARRE_5TH_SHAPES, POWER_CHORD_SHAPES,
  rootFretFor, transposedFrets, moveableChordName, shapePositions,
  ChordShape, MoveableChordShape,
} from '@/domain/chordShapes';
import { detectFromPositions, chordSymbol, pitchDisplayName } from '@/domain/chordDetect';

const ALL_OPEN_SHAPES: ChordShape[] = [
  ...OPEN_CHORDS, ...OPEN_SEVENTH_CHORDS, ...SUS_CHORDS,
];
const ALL_MOVEABLE: MoveableChordShape[] = [
  ...BARRE_6TH_SHAPES, ...BARRE_5TH_SHAPES,
];

describe('shape data integrity', () => {
  it.each(
    [...ALL_OPEN_SHAPES.map(s => [s.label, s.frets, s.fingers] as const),
     ...[...ALL_MOVEABLE, ...POWER_CHORD_SHAPES].map(
       s => [s.shapeName, s.frets, s.fingers] as const,
     )],
  )('%s covers all six strings', (_label, frets, fingers) => {
    expect(frets).toHaveLength(6);
    expect(fingers).toHaveLength(6);
  });

  it('barres span strings that are actually fretted at the barre fret', () => {
    for (const s of ALL_MOVEABLE) {
      if (!s.barre) continue;
      expect(s.frets[s.barre.fromString]).toBe(s.barre.fret);
      expect(s.frets[s.barre.toString]).toBe(s.barre.fret);
    }
  });

  it('moveable shapes carry their root on the declared root string at fret 1', () => {
    for (const s of [...ALL_MOVEABLE, ...POWER_CHORD_SHAPES]) {
      expect(s.frets[s.rootString]).toBe(1);
    }
  });
});

describe('open chords sound as labelled', () => {
  it.each(ALL_OPEN_SHAPES.map(s => [s.label, s] as const))(
    '%s is detected from its voicing',
    (_label, shape) => {
      const matches = detectFromPositions(shapePositions(shape.frets));
      expect(matches.length).toBeGreaterThan(0);
      expect(chordSymbol(matches[0])).toBe(shape.label);
      expect(matches[0].rootPc).toBe(shape.rootPc);
    },
  );
});

describe('moveable shapes sound as named at every root', () => {
  it.each(ALL_MOVEABLE.map(s => [`${s.shapeName} (${s.suffix || 'major'})`, s] as const))(
    '%s is detected for all 12 roots',
    (_label, shape) => {
      for (let rootPc = 0; rootPc < 12; rootPc++) {
        const rootFret = rootFretFor(shape, rootPc);
        const frets = transposedFrets(shape, rootFret);
        const matches = detectFromPositions(shapePositions(frets));
        expect(matches.length).toBeGreaterThan(0);
        expect(chordSymbol(matches[0])).toBe(moveableChordName(shape, rootPc));
      }
    },
  );
});

describe('rootFretFor', () => {
  it('places 6th-string roots at known frets', () => {
    const eShape = BARRE_6TH_SHAPES[0];
    expect(rootFretFor(eShape, 5)).toBe(1);   // F
    expect(rootFretFor(eShape, 7)).toBe(3);   // G
    expect(rootFretFor(eShape, 9)).toBe(5);   // A
    expect(rootFretFor(eShape, 4)).toBe(12);  // E — shown at the octave, not open
  });

  it('places 5th-string roots at known frets', () => {
    const aShape = BARRE_5TH_SHAPES[0];
    expect(rootFretFor(aShape, 10)).toBe(1);  // Bb
    expect(rootFretFor(aShape, 0)).toBe(3);   // C
    expect(rootFretFor(aShape, 2)).toBe(5);   // D
    expect(rootFretFor(aShape, 9)).toBe(12);  // A
  });
});

describe('transposedFrets', () => {
  it('shifts fretted strings and leaves muted strings alone', () => {
    const eShape = BARRE_6TH_SHAPES[0];
    expect(transposedFrets(eShape, 3)).toEqual([3, 5, 5, 4, 3, 3]); // G major
    const maj7 = BARRE_6TH_SHAPES[4];
    expect(transposedFrets(maj7, 3)).toEqual([3, -1, 4, 4, 3, -1]); // Gmaj7
  });
});

describe('power chords', () => {
  it.each(POWER_CHORD_SHAPES.map(s => [s.shapeName, s] as const))(
    '%s contains only root and fifth at every root',
    (_label, shape) => {
      for (let rootPc = 0; rootPc < 12; rootPc++) {
        const frets = transposedFrets(shape, rootFretFor(shape, rootPc));
        const pcs = new Set(
          shapePositions(frets).map(p => (p.string.openPitchClass + p.fret) % 12),
        );
        expect(pcs).toEqual(new Set([rootPc, (rootPc + 7) % 12]));
      }
    },
  );

  it('names follow the root', () => {
    expect(moveableChordName(POWER_CHORD_SHAPES[0], 7)).toBe('G5');
    expect(moveableChordName(POWER_CHORD_SHAPES[1], 1)).toBe('C#5');
  });
});

describe('moveableChordName', () => {
  it('uses conventional spellings with quality suffixes', () => {
    expect(moveableChordName(BARRE_6TH_SHAPES[0], 6)).toBe('F#');
    expect(moveableChordName(BARRE_6TH_SHAPES[1], 10)).toBe('Bbm');
    expect(moveableChordName(BARRE_5TH_SHAPES[2], 3)).toBe('Eb7');
    expect(moveableChordName(BARRE_5TH_SHAPES[4], 0)).toBe('Cmaj7');
    expect(pitchDisplayName(8)).toBe('Ab');
  });
});
