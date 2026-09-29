import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import {
  ALL_INTERVALS,
  INTERVAL_FULL_NAMES,
  INTERVAL_SEMITONES,
  INTERVAL_SONG_HINTS,
  IntervalName,
} from '@/domain/earInterval';
import { INTERVAL_CHARACTER, describeShape, noteAbove } from '@/domain/intervalStudy';

const COLOR = '#007AFF';
const EXAMPLE_ROOT = 'C';

function IntervalCard({ interval }: { interval: IntervalName }) {
  const semitones = INTERVAL_SEMITONES[interval];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: COLOR + '1A' }]}>
          <Text style={[styles.badgeText, { color: COLOR }]}>{interval}</Text>
        </View>
        <Text style={styles.cardTitle}>{INTERVAL_FULL_NAMES[interval]}</Text>
        <Text style={styles.semitones}>
          {semitones} {semitones === 1 ? 'fret' : 'frets'}
        </Text>
      </View>
      <Text style={styles.character}>{INTERVAL_CHARACTER[interval]}</Text>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Example</Text>
        <Text style={styles.rowValue}>
          {EXAMPLE_ROOT} → {noteAbove(EXAMPLE_ROOT, interval)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>On the neck</Text>
        <Text style={styles.rowValue}>{describeShape(interval)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Sounds like</Text>
        <Text style={styles.rowValue}>{INTERVAL_SONG_HINTS[interval]}</Text>
      </View>
    </View>
  );
}

export default function IntervalsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.introTitle}>Half steps and whole steps</Text>
        <Text style={styles.introText}>
          An interval is the distance between two notes. The smallest distance is a half step
          (one semitone) — exactly one fret on the guitar. A whole step is two frets.
          {'\n\n'}
          Intervals are named by counting letter names (C to E is a 3rd) and qualified by their
          size in half steps: major (M) and minor (m) for 2nds, 3rds, 6ths and 7ths, perfect (P)
          for 4ths, 5ths and octaves, and the tritone (TT) in the middle.
        </Text>
        <Text style={styles.introText}>
          Shapes below are measured from the lower note on the E·A·D·G strings. When a shape
          crosses from the G string to the B string, add one fret.
        </Text>
      </View>

      {ALL_INTERVALS.map(interval => (
        <IntervalCard key={interval} interval={interval} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  introTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  introText: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  semitones: { fontSize: 13, color: '#8E8E93' },
  character: { fontSize: 14, color: '#3A3A3C', lineHeight: 20 },
  row: { flexDirection: 'row', gap: 8 },
  rowLabel: { width: 84, fontSize: 13, color: '#8E8E93' },
  rowValue: { flex: 1, fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
});
