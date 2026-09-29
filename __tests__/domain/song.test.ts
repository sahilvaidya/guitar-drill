import {
  Song, pickSong, songWeight, normalizeUrl, formatLastPracticed,
} from '../../src/domain/song';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 100 * DAY;

function song(over: Partial<Song> = {}): Song {
  return {
    id: 'a', title: 'A', artist: '', url: 'https://x.com/a', mastery: 'learning',
    notes: '', createdAt: 0, lastPracticedAt: null, practiceCount: 0, ...over,
  };
}

describe('normalizeUrl', () => {
  it('accepts full URLs and adds https to bare hosts', () => {
    expect(normalizeUrl('https://tabs.ultimate-guitar.com/tab/x-123')).toBe('https://tabs.ultimate-guitar.com/tab/x-123');
    expect(normalizeUrl(' ultimate-guitar.com/tab/1 ')).toBe('https://ultimate-guitar.com/tab/1');
  });
  it('rejects junk', () => {
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('localhost')).toBeNull();
  });
});

describe('songWeight', () => {
  it('weights less mastered songs higher', () => {
    const learning = songWeight(song({ mastery: 'learning', lastPracticedAt: NOW }), NOW);
    const mastered = songWeight(song({ mastery: 'mastered', lastPracticedAt: NOW }), NOW);
    expect(learning).toBeGreaterThan(mastered);
  });
  it('weights stale and never-practiced songs higher', () => {
    const fresh = songWeight(song({ lastPracticedAt: NOW }), NOW);
    const stale = songWeight(song({ lastPracticedAt: NOW - 10 * DAY }), NOW);
    const never = songWeight(song({ lastPracticedAt: null }), NOW);
    expect(stale).toBeGreaterThan(fresh);
    expect(never).toBeGreaterThanOrEqual(stale);
  });
});

describe('pickSong', () => {
  it('returns null for an empty list', () => {
    expect(pickSong([], NOW)).toBeNull();
  });
  it('excludes the previous pick when others exist', () => {
    const songs = [song({ id: 'a' }), song({ id: 'b' })];
    for (const r of [0, 0.3, 0.6, 0.99]) {
      expect(pickSong(songs, NOW, () => r, 'a')!.id).toBe('b');
    }
  });
  it('still returns the only song even if it was the last pick', () => {
    expect(pickSong([song({ id: 'a' })], NOW, () => 0, 'a')!.id).toBe('a');
  });
  it('follows the weights', () => {
    const songs = [
      song({ id: 'learn', mastery: 'learning', lastPracticedAt: NOW }),
      song({ id: 'done', mastery: 'mastered', lastPracticedAt: NOW }),
    ];
    // weights 4 vs 1 → first 80% of the range picks 'learn'
    expect(pickSong(songs, NOW, () => 0.79)!.id).toBe('learn');
    expect(pickSong(songs, NOW, () => 0.81)!.id).toBe('done');
  });
});

describe('formatLastPracticed', () => {
  it('describes recency', () => {
    expect(formatLastPracticed(null, NOW)).toBe('Never practiced');
    expect(formatLastPracticed(NOW - 1000, NOW)).toBe('Practiced today');
    expect(formatLastPracticed(NOW - DAY, NOW)).toBe('Practiced yesterday');
    expect(formatLastPracticed(NOW - 5 * DAY, NOW)).toBe('Practiced 5 days ago');
  });
});
