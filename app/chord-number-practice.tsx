import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, SafeAreaView, Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  ChordNumberPrompt,
  generateChordNumberPrompt,
  diatonicChord,
} from '@/domain/chordNumberPractice';

const MAJOR_COLOR = '#007AFF';
const MINOR_COLOR = '#5856D6';

function keyColor(prompt: ChordNumberPrompt): string {
  return prompt.keyQuality === 'major' ? MAJOR_COLOR : MINOR_COLOR;
}

export default function ChordNumberPracticeScreen() {
  const [prompt, setPrompt] = useState<ChordNumberPrompt>(() =>
    generateChordNumberPrompt(),
  );
  const [revealed, setRevealed] = useState(false);

  const newPrompt = useCallback(() => {
    setPrompt(generateChordNumberPrompt());
    setRevealed(false);
  }, []);

  const accent = keyColor(prompt);

  return (
    <>
      <Stack.Screen options={{ title: 'Chord Numbers', headerBackTitle: 'Practice' }} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.instruction}>
              Play the progression by ear and shape. You get the key and the
              numbers — figure out which chord each number is and where it lives
              on the neck. Tap Reveal to check.
            </Text>
          </View>

          {/* Key */}
          <View style={styles.keyCard}>
            <Text style={styles.keyLabelCaption}>Key</Text>
            <Text style={[styles.keyLabel, { color: accent }]}>
              {prompt.keyRoot}
              <Text style={styles.keyQuality}>
                {'  '}
                {prompt.keyQuality}
              </Text>
            </Text>
          </View>

          {/* Progression numbers */}
          <View style={styles.progressionCard}>
            <Text style={styles.progressionCaption}>
              {prompt.numbers.length} chords
            </Text>
            <View style={styles.numbersRow}>
              {prompt.numbers.map((n, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Text style={styles.separator}>–</Text>}
                  <View style={[styles.numberBadge, { borderColor: accent }]}>
                    <Text style={[styles.numberText, { color: accent }]}>{n}</Text>
                    {revealed && (
                      <Text style={styles.revealText}>
                        {diatonicChord(prompt.keyPitchClass, prompt.keyQuality, n).symbol}
                      </Text>
                    )}
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Reveal / hide toggle */}
          <Pressable
            style={[styles.revealButton, revealed && styles.revealButtonActive]}
            onPress={() => setRevealed(r => !r)}
          >
            <Text style={[styles.revealButtonText, revealed && styles.revealButtonTextActive]}>
              {revealed ? 'Hide chords' : 'Reveal chords'}
            </Text>
          </Pressable>

          {/* Full key reference, shown when revealed */}
          {revealed && (
            <View style={styles.card}>
              <Text style={styles.referenceCaption}>
                All chords in {prompt.keyRoot} {prompt.keyQuality}
              </Text>
              <View style={styles.referenceGrid}>
                {[1, 2, 3, 4, 5, 6, 7].map(n => {
                  const chord = diatonicChord(prompt.keyPitchClass, prompt.keyQuality, n);
                  const inProgression = prompt.numbers.includes(n);
                  return (
                    <View
                      key={n}
                      style={[styles.refCell, inProgression && { backgroundColor: '#EAF2FF' }]}
                    >
                      <Text style={styles.refNumber}>{n}</Text>
                      <Text style={styles.refSymbol}>{chord.symbol}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* New progression */}
          <Pressable style={styles.newButton} onPress={newPrompt}>
            <Text style={styles.newButtonText}>New progression</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const cardShadow = Platform.select({
  web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as object,
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, ...cardShadow },
  instruction: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },

  keyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    ...cardShadow,
  },
  keyLabelCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  keyLabel: { fontSize: 44, fontWeight: '700' },
  keyQuality: { fontSize: 22, fontWeight: '500', color: '#8E8E93' },

  progressionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    ...cardShadow,
  },
  progressionCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  separator: { fontSize: 24, color: '#C7C7CC', fontWeight: '300' },
  numberBadge: {
    minWidth: 56,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  numberText: { fontSize: 30, fontWeight: '700' },
  revealText: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginTop: 2 },

  revealButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  revealButtonActive: { backgroundColor: '#EAF2FF' },
  revealButtonText: { fontSize: 16, fontWeight: '600', color: '#007AFF' },
  revealButtonTextActive: { color: '#007AFF' },

  referenceCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  referenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  refCell: {
    width: 64,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  refNumber: { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
  refSymbol: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginTop: 2 },

  newButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  newButtonText: { fontSize: 17, fontWeight: '600', color: '#fff' },
});
