const store: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { store[key] = value; return Promise.resolve(); }),
}));

import { loadSongs, saveSongs } from '../../src/services/songStore';

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

describe('songStore', () => {
  it('returns [] when nothing is stored or data is corrupt', async () => {
    expect(await loadSongs()).toEqual([]);
    store.songs = '{oops';
    expect(await loadSongs()).toEqual([]);
  });

  it('round-trips songs and repairs missing/invalid fields', async () => {
    store.songs = JSON.stringify([
      { id: 'a', title: 'A', url: 'https://x.com', mastery: 'bogus' },
      { nope: true },
    ]);
    const songs = await loadSongs();
    expect(songs).toHaveLength(1);
    expect(songs[0]).toMatchObject({ mastery: 'learning', notes: '', lastPracticedAt: null, practiceCount: 0 });
    await saveSongs(songs);
    expect(await loadSongs()).toEqual(songs);
  });
});
