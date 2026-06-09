import {
  PENTATONIC_BOXES,
  SCALE_BOXES,
  THIRDS_RUNS,
  SIXTHS_RUNS,
  CagedBox,
  IntervalRun,
  degreeLabel,
  pitchClassAt,
  boxShapeName,
  buildDiatonicRun,
} from '@/domain/cagedShapes';

// Pitch classes: C=0 … B=11
const C_MAJOR_PCS = new Set([0, 2, 4, 5, 7, 9, 11]); // C D E F G A B
const PENTATONIC_PCS = new Set([0, 2, 4, 7, 9]);     // C D E G A

// Absolute MIDI numbers for open strings, low E → high e (E2 A2 D3 G3 B3 E4)
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];

function boxPitchClasses(box: CagedBox): number[] {
  return box.frets.flatMap((offsets, si) =>
    offsets.map(offset => pitchClassAt(si, box.baseFret + offset)),
  );
}

describe('degreeLabel', () => {
  it('labels C major degrees', () => {
    expect(degreeLabel(0, 'major')).toBe('R');
    expect(degreeLabel(2, 'major')).toBe('2');
    expect(degreeLabel(4, 'major')).toBe('3');
    expect(degreeLabel(5, 'major')).toBe('4');
    expect(degreeLabel(7, 'major')).toBe('5');
    expect(degreeLabel(9, 'major')).toBe('6');
    expect(degreeLabel(11, 'major')).toBe('7');
  });

  it('labels A minor degrees', () => {
    expect(degreeLabel(9, 'minor')).toBe('R');
    expect(degreeLabel(11, 'minor')).toBe('2');
    expect(degreeLabel(0, 'minor')).toBe('♭3');
    expect(degreeLabel(2, 'minor')).toBe('4');
    expect(degreeLabel(4, 'minor')).toBe('5');
    expect(degreeLabel(5, 'minor')).toBe('♭6');
    expect(degreeLabel(7, 'minor')).toBe('♭7');
  });

  it('returns undefined for chromatic notes outside the key', () => {
    expect(degreeLabel(1, 'major')).toBeUndefined();
    expect(degreeLabel(6, 'minor')).toBeUndefined();
  });
});

describe.each([
  ['pentatonic', PENTATONIC_BOXES, PENTATONIC_PCS],
  ['scale', SCALE_BOXES, C_MAJOR_PCS],
] as const)('%s boxes', (_name, boxes, allowedPcs) => {
  it('has five boxes covering all CAGED shapes', () => {
    expect(boxes).toHaveLength(5);
    expect(new Set(boxes.map(b => b.majorShape))).toEqual(
      new Set(['C', 'A', 'G', 'E', 'D']),
    );
  });

  it.each(boxes.map(b => [b.majorShape, b] as const))(
    '%s shape contains only and all in-key notes',
    (_shape, box) => {
      const pcs = boxPitchClasses(box);
      for (const pc of pcs) expect(allowedPcs).toContain(pc);
      expect(new Set(pcs)).toEqual(allowedPcs);
    },
  );

  it.each(boxes.map(b => [b.majorShape, b] as const))(
    '%s shape uses all six strings within a five-fret span',
    (_shape, box) => {
      expect(box.frets).toHaveLength(6);
      const all = box.frets.flat();
      expect(Math.min(...all)).toBe(0);
      expect(Math.max(...all)).toBeLessThanOrEqual(4);
      for (const offsets of box.frets) expect(offsets.length).toBeGreaterThan(0);
    },
  );

  it('pairs each major shape with the relative-minor shape name', () => {
    const pairs = Object.fromEntries(boxes.map(b => [b.majorShape, b.minorShape]));
    expect(pairs).toEqual({ G: 'Em', E: 'Dm', D: 'Cm', C: 'Am', A: 'Gm' });
  });
});

describe('boxShapeName', () => {
  it('returns the framing-specific shape name', () => {
    const box = PENTATONIC_BOXES.find(b => b.majorShape === 'C')!;
    expect(boxShapeName(box, 'major')).toBe('C');
    expect(boxShapeName(box, 'minor')).toBe('Am');
  });
});

function checkRun(run: IntervalRun, validSemis: number[], skip: number) {
  expect(run.upperString - run.lowerString).toBe(skip);
  expect(run.steps).toHaveLength(8);

  let prevLower = -1;
  for (const step of run.steps) {
    // Ascending melody line on the lower string
    expect(step.lowerFret).toBeGreaterThan(prevLower);
    prevLower = step.lowerFret;
    expect(step.upperFret).toBeGreaterThanOrEqual(0);

    // Both notes diatonic to C major
    const lowerPc = pitchClassAt(run.lowerString, step.lowerFret);
    const upperPc = pitchClassAt(run.upperString, step.upperFret);
    expect(C_MAJOR_PCS).toContain(lowerPc);
    expect(C_MAJOR_PCS).toContain(upperPc);

    // Actual sounding interval matches the labelled quality
    const semis =
      OPEN_MIDI[run.upperString] + step.upperFret -
      (OPEN_MIDI[run.lowerString] + step.lowerFret);
    expect(validSemis).toContain(semis);
    expect(step.quality).toBe(
      semis === 4 ? 'M3' : semis === 3 ? 'm3' : semis === 9 ? 'M6' : 'm6',
    );
  }

  // One full octave: run starts and ends on the same degree
  expect(run.steps[0].lowerDegree).toBe(run.steps[7].lowerDegree);
}

describe('THIRDS_RUNS', () => {
  it('covers the three adjacent pairs of the first four strings', () => {
    expect(THIRDS_RUNS.map(r => [r.lowerString, r.upperString])).toEqual([
      [4, 5], // B + e
      [3, 4], // G + B
      [2, 3], // D + G
    ]);
  });

  it.each(THIRDS_RUNS.map((r, i) => [i, r] as const))(
    'run %i harmonizes an octave in diatonic thirds',
    (_i, run) => checkRun(run, [3, 4], 1),
  );

  it('alternates qualities through the harmonized scale', () => {
    // Thirds above degrees 1..7 in major: M m m M M m m
    const run = buildDiatonicRun(4, 5, 2, 0);
    expect(run.steps.map(s => s.quality)).toEqual([
      'M3', 'm3', 'm3', 'M3', 'M3', 'm3', 'm3', 'M3',
    ]);
  });
});

describe('SIXTHS_RUNS', () => {
  it('covers string pairs that skip one string', () => {
    expect(SIXTHS_RUNS.map(r => [r.lowerString, r.upperString])).toEqual([
      [3, 5], // G + e
      [2, 4], // D + B
    ]);
  });

  it.each(SIXTHS_RUNS.map((r, i) => [i, r] as const))(
    'run %i harmonizes an octave in diatonic sixths',
    (_i, run) => checkRun(run, [8, 9], 2),
  );

  it('places sixths above degrees with the right qualities', () => {
    // Sixths above degrees 1..7 in major: M M m M M m m
    const run = buildDiatonicRun(2, 4, 5, 0);
    expect(run.steps.map(s => s.quality)).toEqual([
      'M6', 'M6', 'm6', 'M6', 'M6', 'm6', 'm6', 'M6',
    ]);
  });
});
