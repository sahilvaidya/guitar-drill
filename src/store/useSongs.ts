import { create } from 'zustand';
import { Song, SongMastery, pickSong } from '@/domain/song';
import { loadSongs, saveSongs } from '@/services/songStore';

export interface SongInput {
  title: string;
  artist: string;
  url: string;
  mastery: SongMastery;
  notes: string;
}

interface SongsState {
  songs: Song[];
  loaded: boolean;
  lastPickedId: string | null;
  // injectable for tests
  now: () => number;
  rng: () => number;
  newId: () => string;

  load: () => Promise<void>;
  addSong: (input: SongInput) => Promise<Song>;
  updateSong: (id: string, input: SongInput) => Promise<void>;
  removeSong: (id: string) => Promise<void>;
  /** Weighted-random pick; records the practice (lastPracticedAt, count). Null if no songs. */
  pickForPractice: () => Promise<Song | null>;
}

export const useSongs = create<SongsState>((set, get) => ({
  songs: [],
  loaded: false,
  lastPickedId: null,
  now: () => Date.now(),
  rng: Math.random,
  newId: () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,

  load: async () => {
    const songs = await loadSongs();
    set({ songs, loaded: true });
  },

  addSong: async input => {
    const { songs, now, newId } = get();
    const song: Song = {
      id: newId(),
      ...input,
      createdAt: now(),
      lastPracticedAt: null,
      practiceCount: 0,
    };
    const updated = [song, ...songs];
    set({ songs: updated });
    await saveSongs(updated);
    return song;
  },

  updateSong: async (id, input) => {
    const updated = get().songs.map(s => (s.id === id ? { ...s, ...input } : s));
    set({ songs: updated });
    await saveSongs(updated);
  },

  removeSong: async id => {
    const updated = get().songs.filter(s => s.id !== id);
    set({ songs: updated, lastPickedId: get().lastPickedId === id ? null : get().lastPickedId });
    await saveSongs(updated);
  },

  pickForPractice: async () => {
    const { songs, now, rng, lastPickedId } = get();
    const t = now();
    const picked = pickSong(songs, t, rng, lastPickedId);
    if (!picked) return null;
    const practiced: Song = {
      ...picked,
      lastPracticedAt: t,
      practiceCount: picked.practiceCount + 1,
    };
    const updated = songs.map(s => (s.id === picked.id ? practiced : s));
    set({ songs: updated, lastPickedId: picked.id });
    await saveSongs(updated);
    return practiced;
  },
}));
