import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song, isSongMastery } from '@/domain/song';

const SONGS_KEY = 'songs';

function parseSong(raw: unknown): Song | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.url !== 'string') return null;
  return {
    id: r.id,
    title: r.title,
    artist: typeof r.artist === 'string' ? r.artist : '',
    url: r.url,
    mastery: isSongMastery(r.mastery) ? r.mastery : 'learning',
    notes: typeof r.notes === 'string' ? r.notes : '',
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : 0,
    lastPracticedAt: typeof r.lastPracticedAt === 'number' ? r.lastPracticedAt : null,
    practiceCount: typeof r.practiceCount === 'number' ? r.practiceCount : 0,
  };
}

export async function loadSongs(): Promise<Song[]> {
  try {
    const raw = await AsyncStorage.getItem(SONGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(parseSong).filter((s): s is Song => s !== null);
  } catch {
    return [];
  }
}

export async function saveSongs(songs: Song[]): Promise<void> {
  await AsyncStorage.setItem(SONGS_KEY, JSON.stringify(songs));
}
