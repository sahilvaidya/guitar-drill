import React, { useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSongs } from '@/store/useSongs';
import { SONG_MASTERY_LABELS, formatLastPracticed, Song } from '@/domain/song';

export default function SongsScreen() {
  const router = useRouter();
  const songs = useSongs(s => s.songs);
  const load = useSongs(s => s.load);
  const now = useSongs(s => s.now)();

  useEffect(() => { load(); }, [load]);

  const open = useCallback((song: Song) => {
    Linking.openURL(song.url).catch(() => Alert.alert('Could not open link', song.url));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: 'My Songs',
          headerRight: () => (
            <Pressable onPress={() => router.push('/song-edit')} hitSlop={8}>
              <Text style={styles.headerButton}>Add</Text>
            </Pressable>
          ),
        }}
      />
      {songs.length === 0 && (
        <Text style={styles.empty}>
          No songs yet. Tap Add and paste a tab link (Ultimate Guitar, Songsterr, anything).
        </Text>
      )}
      {songs.map(song => (
        <View key={song.id} style={styles.card}>
          <Pressable onPress={() => open(song)}>
            <Text style={styles.title}>{song.title}</Text>
            {!!song.artist && <Text style={styles.artist}>{song.artist}</Text>}
            <Text style={styles.meta}>
              {SONG_MASTERY_LABELS[song.mastery]} · {formatLastPracticed(song.lastPracticedAt, now)}
            </Text>
            {!!song.notes && <Text style={styles.notes}>{song.notes}</Text>}
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/song-edit', params: { id: song.id } })}>
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, gap: 12 },
  headerButton: { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  empty: { fontSize: 15, color: '#8E8E93', lineHeight: 22 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8 },
  title: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  artist: { fontSize: 14, color: '#3C3C43', marginTop: 2 },
  meta: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  notes: { fontSize: 14, color: '#3C3C43', marginTop: 6, lineHeight: 20 },
  edit: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
});
