const storage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(storage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { storage[key] = value; return Promise.resolve(); }),
  removeItem: jest.fn((key: string) => { delete storage[key]; return Promise.resolve(); }),
}));

import { useSongs } from '@/store/useSongs';
import { loadSongs } from '@/services/songStore';

let t: number;
let n: number;
const input = (title: string) => ({ title, artist: '', url: `https://x.com/${title}`, mastery: 'learning' as const, notes: '' });

beforeEach(() => {
  Object.keys(storage).forEach(k => delete storage[k]);
  t = 1_000;
  n = 0;
  useSongs.setState({
    songs: [], loaded: false, lastPickedId: null,
    now: () => t, rng: () => 0, newId: () => `id${n++}`,
  });
});

describe('useSongs', () => {
  it('adds, persists and reloads songs', async () => {
    await useSongs.getState().addSong(input('One'));
    expect((await loadSongs()).map(s => s.title)).toEqual(['One']);
    useSongs.setState({ songs: [] });
    await useSongs.getState().load();
    expect(useSongs.getState().songs).toHaveLength(1);
  });

  it('updates and removes songs', async () => {
    const s = await useSongs.getState().addSong(input('One'));
    await useSongs.getState().updateSong(s.id, { ...input('One'), mastery: 'solid', notes: 'bridge' });
    expect(useSongs.getState().songs[0]).toMatchObject({ mastery: 'solid', notes: 'bridge' });
    await useSongs.getState().removeSong(s.id);
    expect(await loadSongs()).toEqual([]);
  });

  it('returns null when picking with no songs', async () => {
    expect(await useSongs.getState().pickForPractice()).toBeNull();
  });

  it('records practice on pick and avoids repeating the last pick', async () => {
    await useSongs.getState().addSong(input('One'));
    await useSongs.getState().addSong(input('Two'));
    const first = await useSongs.getState().pickForPractice();
    expect(first).toMatchObject({ practiceCount: 1, lastPracticedAt: 1_000 });
    const second = await useSongs.getState().pickForPractice();
    expect(second!.id).not.toBe(first!.id);
    expect((await loadSongs()).every(s => s.practiceCount === 1)).toBe(true);
  });
});
