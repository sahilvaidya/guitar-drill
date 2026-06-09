import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';

interface ModeCardProps {
  title: string;
  description: string;
  badge?: string;
  onPress: () => void;
}

function ModeCard({ title, description, badge, onPress }: ModeCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardDescription}>{description}</Text>
    </Pressable>
  );
}

export default function NoteIdentificationScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Note Identification', headerBackTitle: 'Home' }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.sectionHeader}>Modes</Text>
          <ModeCard
            title="Training"
            description="Identify the note at a highlighted fret position at your own pace, with feedback and retries."
            onPress={() => router.push('/drill')}
          />
          <ModeCard
            title="Speed Game"
            description="Race the clock: keep your average response time under 5 seconds or it's game over. Wrong answers cost 6 seconds."
            badge="Game"
            onPress={() => router.push('/speed-game')}
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  badge: {
    backgroundColor: '#FF950022',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF9500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardDescription: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
});
