import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Platform, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSongs } from '@/store/useSongs';

interface DrillCardProps {
  title: string;
  description: string;
  onPress: () => void;
  available?: boolean;
}

function DrillCard({ title, description, onPress, available = true }: DrillCardProps) {
  return (
    <Pressable
      style={[styles.card, !available && styles.cardDisabled]}
      onPress={available ? onPress : undefined}
      disabled={!available}
    >
      <Text style={[styles.cardTitle, !available && styles.textDisabled]}>{title}</Text>
      <Text style={[styles.cardDescription, !available && styles.textDisabled]}>{description}</Text>
      {!available && <Text style={styles.comingSoon}>Coming soon</Text>}
    </Pressable>
  );
}

export default function PracticeTab() {
  const router = useRouter();
  const songCount = useSongs(s => s.songs.length);
  const loadSongs = useSongs(s => s.load);
  const pickForPractice = useSongs(s => s.pickForPractice);

  React.useEffect(() => { loadSongs(); }, [loadSongs]);

  const practiceRandomSong = async () => {
    const song = await pickForPractice();
    if (!song) {
      router.push('/songs');
      return;
    }
    Linking.openURL(song.url).catch(() => Alert.alert('Could not open link', song.url));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionHeader}>Drills</Text>
        <DrillCard
          title="Note Identification"
          description="Name notes on the fretboard — train at your own pace or race the clock."
          onPress={() => router.push('/note-identification')}
        />
        <DrillCard
          title="Chord Detector"
          description="Tap notes on the fretboard and see what chord you've built."
          onPress={() => router.push('/chord-detector')}
        />
        <DrillCard
          title="Inverse Note Finder"
          description="Tap the correct fret position for a given note name."
          onPress={() => router.push('/inverse-drill')}
        />
        <DrillCard
          title="Chord Numbers"
          description="Get a key and a numbered progression (1–7) — find each chord on the neck."
          onPress={() => router.push('/chord-number-practice')}
        />
        <Text style={styles.sectionHeader}>Songs</Text>
        <DrillCard
          title="Practice a Random Song"
          description={
            songCount === 0
              ? 'Save songs first, then get a random pick weighted toward what needs work.'
              : 'Opens a saved tab, favoring songs you know least or haven\'t played lately.'
          }
          onPress={practiceRandomSong}
        />
        <DrillCard
          title="My Songs"
          description="Save tab links with a mastery level and notes on what to practice."
          onPress={() => router.push('/songs')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { flex: 1, padding: 16, gap: 12 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as object,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  cardDisabled: { opacity: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  cardDescription: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  textDisabled: { color: '#AEAEB2' },
  comingSoon: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
