import { TriadQuality } from './triad';

/**
 * The interval role a string plays within a triad shape.
 * Displayed as a label inside the dot on the chord diagram.
 */
export type NoteRole = 'R' | 'M3' | 'm3' | 'P5' | 'd5' | 'A5';

export const NOTE_ROLE_LABEL: Record<NoteRole, string> = {
  R:  'R',
  M3: '3',
  m3: '♭3',
  P5: '5',
  d5: '♭5',
  A5: '♯5',
};

/**
 * A moveable triad voicing on the top-3 strings (G, B, e).
 *
 * Array index convention throughout: [0] = G string, [1] = B string, [2] = e string.
 *
 * `offsets` are relative fret positions from the base fret (the lowest fret used in
 * the shape, which is always 0 for at least one string).  Because the shape is
 * moveable, you slide the whole thing to any base fret — the offsets stay the same.
 */
export interface TriadShape {
  /** Fret offsets from base fret: [G, B, e] */
  offsets: [number, number, number];
  /** Interval role for each string: [G, B, e] */
  roles: [NoteRole, NoteRole, NoteRole];
  /** Human-readable inversion label shown below the diagram */
  label: string;
}

/**
 * All three closed-position voicings for each quality on strings G·B·e.
 *
 * Verified against standard tuning (open strings: G=7, B=11, e=4 in pitch-class):
 *
 * MAJOR  root-pos  G=R(+2)  B=3(+2)  e=5(0)   e.g. C: frets 5,5,3
 *        1st-inv   G=3(+1)  B=5(0)   e=R(0)   e.g. C: frets 9,8,8
 *        2nd-inv   G=5(0)   B=R(+1)  e=3(0)   e.g. C: frets 0,1,0 (open pos)
 *
 * MINOR  root-pos  G=R(+2)  B=♭3(+1) e=5(0)   e.g. C: frets 5,4,3
 *        1st-inv   G=♭3(0)  B=5(0)   e=R(0)   e.g. C: frets 8,8,8 (barre)
 *        2nd-inv   G=5(+1)  B=R(+2)  e=♭3(0)  e.g. F: frets 5,6,4
 *
 * DIM    root-pos  G=R(+3)  B=♭3(+2) e=♭5(0)  e.g. C: frets 5,4,2
 *        1st-inv   G=♭3(+1) B=♭5(0)  e=R(+1)  e.g. C: frets 8,7,8
 *        2nd-inv   G=♭5(0)  B=R(+2)  e=♭3(0)  e.g. C: frets 11,13,11
 *
 * AUG    all inv.  G(+1)    B(+1)    e(0)     e.g. C: frets 5,5,4
 *        (augmented triad is symmetric — all 3 voicings share the same dot pattern)
 */
export const TRIAD_SHAPES: Record<TriadQuality, TriadShape[]> = {
  major: [
    { offsets: [2, 2, 0], roles: ['R',  'M3', 'P5'], label: 'Root pos.' },
    { offsets: [1, 0, 0], roles: ['M3', 'P5', 'R' ], label: '1st inv.'  },
    { offsets: [0, 1, 0], roles: ['P5', 'R',  'M3'], label: '2nd inv.'  },
  ],
  minor: [
    { offsets: [2, 1, 0], roles: ['R',  'm3', 'P5'], label: 'Root pos.' },
    { offsets: [0, 0, 0], roles: ['m3', 'P5', 'R' ], label: '1st inv.'  },
    { offsets: [1, 2, 0], roles: ['P5', 'R',  'm3'], label: '2nd inv.'  },
  ],
  diminished: [
    { offsets: [3, 2, 0], roles: ['R',  'm3', 'd5'], label: 'Root pos.' },
    { offsets: [1, 0, 1], roles: ['m3', 'd5', 'R' ], label: '1st inv.'  },
    { offsets: [0, 2, 0], roles: ['d5', 'R',  'm3'], label: '2nd inv.'  },
  ],
  augmented: [
    { offsets: [1, 1, 0], roles: ['R',  'M3', 'A5'], label: 'Root pos.' },
    { offsets: [1, 1, 0], roles: ['M3', 'A5', 'R' ], label: '1st inv.'  },
    { offsets: [1, 1, 0], roles: ['A5', 'R',  'M3'], label: '2nd inv.'  },
  ],
};
