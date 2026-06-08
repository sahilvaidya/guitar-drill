import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, useWindowDimensions,
  Pressable, SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useInversePracticeSession } from '@/store/useInversePracticeSession';
import FretboardView from '@/components/FretboardView';
import { StatChip, ChipRow } from '@/components/StatsChips';
import { fretRangeLabel } from '@/domain/fretRange';
import { FretPosition } from '@/domain/fretPosition';

const FRETBOARD_HEIGHT = 220;
const AUTO_ADVANCE_MS = 1500;
const WRONG_FLASH_MS = 700;

export default function InverseDrillScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const fretboardWidth = width - 32;

  const {
    prompt, revealPositions, wrongTapPosition, isRevealed,
    sessionStats, lifetimeStats, fretRange,
    initialize, tapPosition, nextPrompt, clearWrongTap,
  } = useInversePracticeSession();

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (isRevealed) {
      autoAdvanceTimer.current = setTimeout(() => {
        nextPrompt();
      }, AUTO_ADVANCE_MS);
    }
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [isRevealed]);

  useEffect(() => {
    if (wrongTapPosition) {
      wrongFlashTimer.current = setTimeout(() => {
        clearWrongTap();
      }, WRONG_FLASH_MS);
    }
    return () => {
      if (wrongFlashTimer.current) clearTimeout(wrongFlashTimer.current);
    };
  }, [wrongTapPosition]);

  const handlePositionTap = (pos: FretPosition) => {
    tapPosition(pos);
  };

  const highlighted = [
    ...revealPositions.map(pos => ({ pos, color: '#28A745' })),
    ...(wrongTapPosition ? [{ pos: wrongTapPosition, color: '#DC3545' }] : []),
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
          {/* session stats */}
          <ChipRow>
            <StatChip label="Solved" value={sessionStats.solvedPrompts} />
            <StatChip label="Attempts" value={sessionStats.attempts} />
            <StatChip label="Streak" value={sessionStats.streak} />
          </ChipRow>

          {/* prompt card */}
          <View style={styles.card}>
            <Text style={styles.promptInstruction}>Tap this note on the fretboard</Text>
            <Text style={styles.promptNote}>{prompt.displayNote}</Text>
            <Text style={styles.promptRange}>{fretRangeLabel(fretRange)}</Text>
          </View>

          {/* fretboard */}
          <FretboardView
            width={fretboardWidth}
            height={FRETBOARD_HEIGHT}
            onPositionTap={isRevealed ? undefined : handlePositionTap}
            highlightedPositions={highlighted}
          />

          {/* feedback */}
          {isRevealed && (
            <View style={[styles.card, styles.feedbackCorrect]}>
              <Text style={[styles.feedbackText, styles.feedbackTextCorrect]}>
                ✓ Correct — all positions highlighted
              </Text>
            </View>
          )}

          {/* lifetime stats */}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  promptInstruction: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  promptNote: { fontSize: 48, fontWeight: '800', color: '#1C1C1E', marginBottom: 2 },
  promptRange: { fontSize: 13, color: '#8E8E93' },

  feedbackCorrect: { backgroundColor: '#D4EDDA', borderWidth: 1, borderColor: '#28A745' },
  feedbackText: { fontSize: 16, fontWeight: '600' },
  feedbackTextCorrect: { color: '#155724' },
});
