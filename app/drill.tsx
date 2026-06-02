import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, useWindowDimensions,
  Pressable, SafeAreaView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { usePracticeSession, useAnswerChoices } from '@/store/usePracticeSession';
import FretboardView from '@/components/FretboardView';
import AnswerGrid from '@/components/AnswerGrid';
import { StatChip, ChipRow, TimingChip } from '@/components/StatsChips';
import { fretRangeLabel } from '@/domain/fretRange';

const FRETBOARD_HEIGHT = 220;
const AUTO_ADVANCE_MS = 1500;

export default function DrillScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const fretboardWidth = width - 32;

  const {
    prompt, feedback, sessionStats, lifetimeStats,
    timingStats, lastCorrectDuration, fretRange,
    initialize, submit, nextPrompt,
  } = usePracticeSession();
  const choices = useAnswerChoices();

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (feedback?.isCorrect) {
      autoAdvanceTimer.current = setTimeout(() => {
        nextPrompt();
      }, AUTO_ADVANCE_MS);
    }
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [feedback]);

  if (!prompt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stringLabel = prompt.position.string.label.toUpperCase();
  const fretLabel = prompt.position.fret === 0
    ? 'Open string'
    : `Fret ${prompt.position.fret}`;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Note Finder',
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
            <Text style={styles.promptInstruction}>What note is this?</Text>
            <Text style={styles.promptPosition}>{stringLabel} string · {fretLabel}</Text>
            <Text style={styles.promptRange}>{fretRangeLabel(fretRange)}</Text>
          </View>

          {/* fretboard */}
          <FretboardView
            prompt={prompt}
            width={fretboardWidth}
            height={FRETBOARD_HEIGHT}
          />

          {/* feedback */}
          {feedback && (
            <View style={[styles.card, feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
              <Text style={[styles.feedbackText, feedback.isCorrect ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect]}>
                {feedback.isCorrect ? '✓ Correct' : `✗ Incorrect — ${prompt.correctAnswer}`}
              </Text>
              {feedback.isCorrect && lastCorrectDuration !== null && (
                <Text style={styles.feedbackTiming}>{lastCorrectDuration.toFixed(1)}s</Text>
              )}
            </View>
          )}

          {/* answer grid */}
          <AnswerGrid choices={choices} feedback={feedback} onSelect={submit} />

          {/* lifetime stats */}
          <ChipRow>
            <StatChip label="Total" value={lifetimeStats.totalAnswers} />
            <StatChip label="Correct" value={lifetimeStats.correctAnswers} />
            <StatChip label="Best streak" value={lifetimeStats.bestStreak} />
          </ChipRow>

          {/* timing stats */}
          <ChipRow>
            <TimingChip label="Last" seconds={lastCorrectDuration} />
            <TimingChip label="Avg (5)" seconds={timingStats.averageDuration} />
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
  promptPosition: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  promptRange: { fontSize: 13, color: '#8E8E93' },

  feedbackCorrect: { backgroundColor: '#D4EDDA', borderWidth: 1, borderColor: '#28A745' },
  feedbackIncorrect: { backgroundColor: '#F8D7DA', borderWidth: 1, borderColor: '#DC3545' },
  feedbackText: { fontSize: 16, fontWeight: '600' },
  feedbackTextCorrect: { color: '#155724' },
  feedbackTextIncorrect: { color: '#721C24' },
  feedbackTiming: { fontSize: 13, color: '#155724', marginTop: 2 },
});
