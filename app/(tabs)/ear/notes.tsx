import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEarNoteId, EarNoteFeedback } from '@/store/useEarNoteId';
import { NoteName, naturalNotes, chromaticNotes } from '@/domain/noteName';
import { EarNoteSet, noteOctaveLabel } from '@/domain/earNote';
import { playNotePrompt, startAudioKeepAlive, stopIntervalAudio } from '@/services/earAudio';
import { StatChip, ChipRow } from '@/components/StatsChips';

const AUTO_ADVANCE_MS = 1500;

const NOTE_SET_OPTIONS: EarNoteSet[] = ['natural', 'chromatic'];
const NOTE_SET_LABELS: Record<EarNoteSet, string> = {
  natural: 'Natural',
  chromatic: 'Chromatic',
};

type ButtonState = 'idle' | 'correct' | 'incorrect' | 'disabled';

function noteButtonState(note: NoteName, feedback: EarNoteFeedback | null): ButtonState {
  if (!feedback) return 'idle';
  if (feedback.isCorrect) return feedback.answer === note ? 'correct' : 'disabled';
  if (feedback.answer === note) return 'incorrect';
  return 'idle'; // wrong answer — other buttons stay active for retry
}

const STATE_STYLES: Record<ButtonState, { bg: string; border: string; text: string }> = {
  idle:      { bg: '#F2F2F7', border: '#E5E5EA', text: '#1C1C1E' },
  correct:   { bg: '#D4EDDA', border: '#28A745', text: '#155724' },
  incorrect: { bg: '#F8D7DA', border: '#DC3545', text: '#721C24' },
  disabled:  { bg: '#F2F2F7', border: '#E5E5EA', text: '#AEAEB2' },
};

function NoteAnswerGrid({
  choices, feedback, onSelect,
}: {
  choices: NoteName[];
  feedback: EarNoteFeedback | null;
  onSelect: (note: NoteName) => void;
}) {
  const rows: NoteName[][] = [];
  for (let i = 0; i < choices.length; i += 3) {
    rows.push(choices.slice(i, i + 3));
  }
  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.gridRow}>
          {row.map(note => {
            const state = noteButtonState(note, feedback);
            const colors = STATE_STYLES[state];
            const disabled = state === 'disabled';
            return (
              <Pressable
                key={note}
                style={[styles.answerButton, { backgroundColor: colors.bg, borderColor: colors.border }]}
                onPress={() => !disabled && onSelect(note)}
                disabled={disabled}
              >
                <Text style={[styles.answerLabel, { color: colors.text }]}>{note}</Text>
              </Pressable>
            );
          })}
          {/* pad the last row so buttons keep equal width */}
          {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
            <View key={`pad-${i}`} style={styles.answerPad} />
          ))}
        </View>
      ))}
    </View>
  );
}

function SegmentedRow<T extends string>({
  label, options, optionLabels, selected, onSelect,
}: {
  label: string;
  options: T[];
  optionLabels: Record<T, string>;
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.segmentBlock}>
      <Text style={styles.segmentLabel}>{label}</Text>
      <View style={styles.segmentRow}>
        {options.map(option => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {optionLabels[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function NoteIdentificationScreen() {
  const {
    prompt, feedback, sessionStats, lifetimeStats, settings,
    initialize, submit, nextPrompt, setNoteSet,
  } = useEarNoteId();

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initialize();
    // Keeps the iOS audio pipeline warm so playback never starts clipped.
    startAudioKeepAlive().catch(() => {});
    return () => stopIntervalAudio();
  }, []);

  // Auto-play each new prompt.
  useEffect(() => {
    if (prompt) {
      playNotePrompt(prompt.midi).catch(() => {});
    }
  }, [prompt]);

  // Confirmation replay on correct answer, then auto-advance.
  useEffect(() => {
    if (feedback?.isCorrect && prompt) {
      playNotePrompt(prompt.midi).catch(() => {});
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

  const choices: NoteName[] = settings.noteSet === 'natural' ? naturalNotes : chromaticNotes;

  return (
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
          {/* Disabled once solved so a replay can't overlap the next prompt's auto-play. */}
          <Pressable
            style={[styles.playButton, feedback?.isCorrect && styles.playButtonDisabled]}
            onPress={() => playNotePrompt(prompt.midi).catch(() => {})}
            disabled={feedback?.isCorrect === true}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.playButtonText}>Replay</Text>
          </Pressable>
        </View>

        {/* feedback */}
        {feedback && (
          <View style={[styles.card, feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
            <Text style={[styles.feedbackText, feedback.isCorrect ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect]}>
              {feedback.isCorrect
                ? `✓ Correct — ${noteOctaveLabel(prompt.midi)}`
                : '✗ Incorrect — listen again'}
            </Text>
          </View>
        )}

        {/* answer grid */}
        <NoteAnswerGrid choices={choices} feedback={feedback} onSelect={submit} />

        {/* drill settings */}
        <View style={styles.card}>
          <SegmentedRow
            label="Notes"
            options={NOTE_SET_OPTIONS}
            optionLabels={NOTE_SET_LABELS}
            selected={settings.noteSet}
            onSelect={setNoteSet}
          />
        </View>

        {/* lifetime stats */}
        <ChipRow>
          <StatChip label="Total" value={lifetimeStats.totalAnswers} />
          <StatChip label="Correct" value={lifetimeStats.correctAnswers} />
          <StatChip label="Best streak" value={lifetimeStats.bestStreak} />
        </ChipRow>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#8E8E93', fontSize: 16 },

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
  promptInstruction: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
  },
  playButtonDisabled: { backgroundColor: '#AEC9EA' },
  playButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  feedbackCorrect: { backgroundColor: '#D4EDDA', borderWidth: 1, borderColor: '#28A745' },
  feedbackIncorrect: { backgroundColor: '#F8D7DA', borderWidth: 1, borderColor: '#DC3545' },
  feedbackText: { fontSize: 16, fontWeight: '600' },
  feedbackTextCorrect: { color: '#155724' },
  feedbackTextIncorrect: { color: '#721C24' },

  grid: { gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  answerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLabel: { fontSize: 15, fontWeight: '600' },
  answerPad: { flex: 1 },

  segmentBlock: { marginBottom: 0 },
  segmentLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 9,
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  segmentTextActive: { color: '#1C1C1E', fontWeight: '600' },
});
