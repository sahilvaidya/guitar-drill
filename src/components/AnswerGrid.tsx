import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feedback } from '@/store/usePracticeSession';

interface Props {
  choices: string[];
  feedback: Feedback | null;
  onSelect: (answer: string) => void;
}

type ButtonState = 'idle' | 'correct' | 'incorrect' | 'disabled';

function buttonState(note: string, feedback: Feedback | null): ButtonState {
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

export default function AnswerGrid({ choices, feedback, onSelect }: Props) {
  const rows: string[][] = [];
  for (let i = 0; i < choices.length; i += 4) {
    rows.push(choices.slice(i, i + 4));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map(note => {
            const state = buttonState(note, feedback);
            const colors = STATE_STYLES[state];
            const disabled = state === 'disabled';
            return (
              <Pressable
                key={note}
                style={[styles.button, { backgroundColor: colors.bg, borderColor: colors.border }]}
                onPress={() => !disabled && onSelect(note)}
                disabled={disabled}
              >
                <Text style={[styles.label, { color: colors.text }]}>{note}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
