import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface StudyTopicCardProps {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  available?: boolean;
}

function StudyTopicCard({
  title,
  description,
  icon,
  onPress,
  available = true,
}: StudyTopicCardProps) {
  return (
    <Pressable
      style={[styles.card, !available && styles.cardDisabled]}
      onPress={available ? onPress : undefined}
      disabled={!available}
    >
      <View style={[styles.iconContainer, !available && styles.iconContainerDisabled]}>
        <Ionicons
          name={icon}
          size={22}
          color={available ? '#007AFF' : '#AEAEB2'}
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, !available && styles.textDisabled]}>{title}</Text>
        <Text style={[styles.cardDescription, !available && styles.textDisabled]}>
          {description}
        </Text>
        {!available && <Text style={styles.comingSoon}>Coming soon</Text>}
      </View>
      {available && (
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      )}
    </Pressable>
  );
}

export default function StudyHomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.sectionHeader}>Chords</Text>
      <StudyTopicCard
        title="Chord Shapes"
        description="Open chords, barre shapes, 7th chords, sus and power chords."
        icon="apps"
        onPress={() => router.push('/study/chords')}
      />
      <StudyTopicCard
        title="Triads"
        description="Major, minor, diminished, and augmented triad theory and shapes."
        icon="musical-notes"
        onPress={() => router.push('/study/triads')}
      />

      <Text style={styles.sectionHeader}>Scales & Intervals</Text>
      <StudyTopicCard
        title="Intervals"
        description="Half steps, whole steps, and the building blocks of harmony."
        icon="git-branch"
        onPress={() => {}}
        available={false}
      />
      <StudyTopicCard
        title="Pentatonic Scales"
        description="The most common scales in rock and blues guitar."
        icon="layers"
        onPress={() => {}}
        available={false}
      />

      <Text style={styles.sectionHeader}>Systems</Text>
      <StudyTopicCard
        title="CAGED System"
        description="Pentatonic boxes, scale positions, and two-string thirds and sixths."
        icon="grid"
        onPress={() => router.push('/study/caged')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, paddingBottom: 40, gap: 8 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: { opacity: 0.5 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EAF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconContainerDisabled: { backgroundColor: '#F2F2F7' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 2 },
  cardDescription: { fontSize: 13, color: '#8E8E93', lineHeight: 18 },
  textDisabled: { color: '#AEAEB2' },
  comingSoon: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
