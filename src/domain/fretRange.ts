export interface FretRange {
  start: number;
  end: number;
}

export const DEFAULT_FRET_RANGE: FretRange = { start: 0, end: 12 };

export function clampedFretRange(start: number, end: number): FretRange {
  const lo = Math.max(0, Math.min(12, start));
  const hi = Math.max(0, Math.min(12, end));
  return lo <= hi ? { start: lo, end: hi } : { start: hi, end: lo };
}

export function fretRangeLabel(range: FretRange): string {
  if (range.start === 0 && range.end === 12) return 'All frets';
  if (range.start === range.end) return `Fret ${range.start}`;
  return `Frets ${range.start}–${range.end}`;
}

export function fretRangeToArray(range: FretRange): number[] {
  const frets: number[] = [];
  for (let f = range.start; f <= range.end; f++) frets.push(f);
  return frets;
}
