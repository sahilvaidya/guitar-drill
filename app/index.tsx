import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

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

export default function HomeScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Guitar Drill', headerLargeTitle: true }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.sectionHeader}>Drills</Text>
          <DrillCard
            title="Note Finder"
            description="Identify the note at a highlighted fret position."
            onPress={() => router.push('/drill')}
          />
          <DrillCard
            title="Chord Detector"
            description="Identify a chord from its fretboard shape."
            available={false}
          />
          <DrillCard
            title="Inverse Note"
            description="Tap the correct fret for a given note name."
            available={false}
          />
        </View>
      </SafeAreaView>
    </>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
