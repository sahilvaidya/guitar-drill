import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, useWindowDimensions,
  Pressable, SafeAreaView, Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useInversePracticeSession } from '@/store/useInversePracticeSession';
import ZoomedFretboardView from '@/components/ZoomedFretboardView';
import { StatChip, ChipRow } from '@/components/StatsChips';
import { fretRangeLabel } from '@/domain/fretRange';
import { FretPosition } from '@/domain/fretPosition';

const FRETBOARD_HEIGHT = 180;
const AUTO_ADVANCE_MS = 1500;

export default function InverseDrillScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const fretboardWidth = width - 32;

  const {
    prompt, wrongTapPositions, isRevealed,
    sessionStats, lifetimeStats, fretRange,
    initialize, tapPosition, nextPrompt,
  } = useInversePracticeSession();

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (isRevealed) {
      autoAdvanceTimer.current = setTimeout(() => nextPrompt(), AUTO_ADVANCE_MS);
    }
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [isRevealed]);

  const highlighted = [
    ...(isRevealed && prompt ? [{ pos: prompt.targetPosition, color: '#28A745' }] : []),
    ...wrongTapPositions.map(pos => ({ pos, color: '#DC3545' })),
  ];

  if (!prompt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Inverse Note Finder',
          headerBackTitle: 'Home',
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ChipRow>
            <StatChip label="Solved" value={sessionStats.solvedPrompts} />
            <StatChip label="Attempts" value={sessionStats.attempts} />
            <StatChip label="Streak" value={sessionStats.streak} />
          </ChipRow>

          <View style={styles.card}>
            <Text style={styles.promptInstruction}>Tap this note on the fretboard</Text>
            <Text style={styles.promptNote}>{prompt.displayNote}</Text>
            <Text style={styles.promptRange}>{fretRangeLabel(fretRange)}</Text>
          </View>

          <ZoomedFretboardView
            windowStrings={prompt.windowStrings}
            windowFrets={prompt.windowFrets}
            width={fretboardWidth}
            height={FRETBOARD_HEIGHT}
            onPositionTap={isRevealed ? undefined : (pos: FretPosition) => tapPosition(pos)}
            highlightedPositions={highlighted}
          />

          {isRevealed && (
            <View style={[styles.card, styles.feedbackCorrect]}>
              <Text style={[styles.feedbackText, styles.feedbackTextCorrect]}>
                ✓ Correct
              </Text>
            </View>
          )}

          <ChipRow>
            <StatChip label="Total" value={lifetimeStats.totalAttempts} />
            <StatChip label="Solved" value={lifetimeStats.solvedPrompts} />
            <StatChip label="Best streak" value={lifetimeStats.bestStreak} />
          </ChipRow>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#8E8E93', fontSize: 16 },
  settingsIcon: { fontSize: 20 },

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
  promptInstruction: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  promptNote: { fontSize: 56, fontWeight: '800', color: '#1C1C1E', marginBottom: 2 },
  promptRange: { fontSize: 13, color: '#8E8E93' },

  feedbackCorrect: { backgroundColor: '#D4EDDA', borderWidth: 1, borderColor: '#28A745' },
  feedbackText: { fontSize: 16, fontWeight: '600' },
  feedbackTextCorrect: { color: '#155724' },
});
