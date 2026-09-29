import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView, Linking, Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSongs } from '@/store/useSongs';
import {
  SONG_MASTERY_LEVELS, SONG_MASTERY_LABELS, SongMastery, normalizeUrl,
} from '@/domain/song';

export default function SongEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { songs, load, addSong, updateSong, removeSong } = useSongs();
  const existing = id ? songs.find(s => s.id === id) : undefined;

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [url, setUrl] = useState('');
  const [mastery, setMastery] = useState<SongMastery>('learning');
  const [notes, setNotes] = useState('');

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setArtist(existing.artist);
    setUrl(existing.url);
    setMastery(existing.mastery);
    setNotes(existing.notes);
    // populate once when the song loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const normalized = normalizeUrl(url);
  const canSave = title.trim().length > 0 && normalized !== null;

  const searchUg = () => {
    const q = encodeURIComponent(`${title} ${artist}`.trim());
    Linking.openURL(`https://www.ultimate-guitar.com/search.php?search_type=title&value=${q}`);
  };

  const save = async () => {
    if (!canSave || !normalized) return;
    const input = { title: title.trim(), artist: artist.trim(), url: normalized, mastery, notes: notes.trim() };
    if (existing) await updateSong(existing.id, input);
    else await addSong(input);
    router.back();
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Delete song?', existing.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await removeSong(existing.id); router.back(); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
    >
      <Stack.Screen options={{ title: existing ? 'Edit Song' : 'Add Song' }} />
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Song title" />
      <Text style={styles.label}>Artist</Text>
      <TextInput style={styles.input} value={artist} onChangeText={setArtist} placeholder="Optional" />
      <Text style={styles.label}>Tab link</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder="Paste a tab URL"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <Pressable onPress={searchUg} disabled={!title.trim()}>
        <Text style={[styles.link, !title.trim() && styles.linkDisabled]}>Search Ultimate Guitar for this song</Text>
      </Pressable>
      <Text style={styles.label}>Mastery</Text>
      <View style={styles.chips}>
        {SONG_MASTERY_LEVELS.map(level => (
          <Pressable
            key={level}
            style={[styles.chip, mastery === level && styles.chipActive]}
            onPress={() => setMastery(level)}
          >
            <Text style={[styles.chipText, mastery === level && styles.chipTextActive]}>
              {SONG_MASTERY_LABELS[level]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Parts to practice</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. bridge solo, fast strumming in chorus"
        multiline
      />
      <Pressable style={[styles.save, !canSave && styles.saveDisabled]} onPress={save} disabled={!canSave}>
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
      {existing && (
        <Pressable onPress={confirmDelete}>
          <Text style={styles.delete}>Delete song</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, paddingBottom: 48, gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', marginTop: 8 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, fontSize: 16, color: '#1C1C1E' },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  link: { fontSize: 14, color: '#007AFF', marginTop: 4 },
  linkDisabled: { color: '#AEAEB2' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  chipActive: { backgroundColor: '#007AFF' },
  chipText: { fontSize: 14, color: '#1C1C1E' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  save: { backgroundColor: '#007AFF', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  saveDisabled: { opacity: 0.4 },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  delete: { color: '#FF3B30', fontSize: 15, textAlign: 'center', marginTop: 16 },
});
