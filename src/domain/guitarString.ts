export type GuitarStringName = 'lowE' | 'A' | 'D' | 'G' | 'B' | 'highE';

export interface GuitarStringDef {
  name: GuitarStringName;
  index: number;
  label: string;
  openPitchClass: number; // semitones from C
}

export const GUITAR_STRINGS: GuitarStringDef[] = [
  { name: 'lowE',  index: 0, label: 'E', openPitchClass: 4  },
  { name: 'A',     index: 1, label: 'A', openPitchClass: 9  },
  { name: 'D',     index: 2, label: 'D', openPitchClass: 2  },
  { name: 'G',     index: 3, label: 'G', openPitchClass: 7  },
  { name: 'B',     index: 4, label: 'B', openPitchClass: 11 },
  { name: 'highE', index: 5, label: 'e', openPitchClass: 4  },
];

export function guitarStringByIndex(index: number): GuitarStringDef {
  const s = GUITAR_STRINGS[index];
  if (!s) throw new Error(`Invalid string index: ${index}`);
  return s;
}
