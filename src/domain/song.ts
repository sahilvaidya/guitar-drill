/** Saved songs the user practices via an external tab site (e.g. Ultimate Guitar). */

export type SongMastery = 'learning' | 'working' | 'solid' | 'mastered';

export const SONG_MASTERY_LEVELS: SongMastery[] = ['learning', 'working', 'solid', 'mastered'];

export const SONG_MASTERY_LABELS: Record<SongMastery, string> = {
  learning: 'Learning',
  working: 'Working on it',
  solid: 'Solid',
  mastered: 'Mastered',
};

/** Less mastered songs come up more often in the random pick. */
export const MASTERY_WEIGHTS: Record<SongMastery, number> = {
  learning: 4,
  working: 3,
  solid: 2,
  mastered: 1,
};

export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  mastery: SongMastery;
  /** Free-text: which parts still need work. */
  notes: string;
  createdAt: number;
  /** Set each time the song is picked for practice; null if never. */
  lastPracticedAt: number | null;
  practiceCount: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function isSongMastery(value: unknown): value is SongMastery {
  return typeof value === 'string' && (SONG_MASTERY_LEVELS as string[]).includes(value);
}

/** Adds https:// when the user pastes a bare host/path; returns null if it isn't a usable web URL. */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (!/^https?:\/\/[^/.\s]+\.[^/\s]+/i.test(withScheme)) return null;
  return withScheme;
}

/**
 * Pick weight: mastery weight × a recency multiplier. Never-practiced songs get the
 * top multiplier; otherwise it grows with days since last practice (capped at 14 days).
 */
export function songWeight(song: Song, now: number): number {
  const recency =
    song.lastPracticedAt === null
      ? 3
      : 1 + 2 * Math.min(Math.max(now - song.lastPracticedAt, 0) / DAY_MS, 14) / 14;
  return MASTERY_WEIGHTS[song.mastery] * recency;
}

/**
 * Weighted random pick. Excludes `excludeId` (the previous pick) when another song exists.
 * `rng` returns [0, 1).
 */
export function pickSong(
  songs: Song[],
  now: number,
  rng: () => number = Math.random,
  excludeId: string | null = null,
): Song | null {
  if (songs.length === 0) return null;
  const pool = songs.length > 1 ? songs.filter(s => s.id !== excludeId) : songs;
  const weights = pool.map(s => songWeight(s, now));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function formatLastPracticed(lastPracticedAt: number | null, now: number): string {
  if (lastPracticedAt === null) return 'Never practiced';
  const days = Math.floor((now - lastPracticedAt) / DAY_MS);
  if (days <= 0) return 'Practiced today';
  if (days === 1) return 'Practiced yesterday';
  return `Practiced ${days} days ago`;
}
