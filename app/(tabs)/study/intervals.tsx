import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { IntervalRun, SIXTHS_RUNS, THIRDS_RUNS } from '@/domain/cagedShapes';
import { GUITAR_STRINGS } from '@/domain/guitarString';
import IntervalRunView from '@/components/IntervalRunView';

type Section = 'thirds' | 'sixths';

const SECTION_LABEL: Record<Section, string> = {
  thirds: '3rds',
  sixths: '6ths',
};

const SECTION: Record<
  Section,
  { runs: IntervalRun[]; color: string; intro: string; legend: string }
> = {
  thirds: {
    runs: THIRDS_RUNS,
    color: '#34C759',
    intro:
      'Diatonic thirds on each adjacent pair of the first four strings. The bottom dot is ' +
      'the scale note, the top dot is the third above it in the key. The quality alternates ' +
      'between major (M3) and minor (m3) thirds as you walk up the scale.',
    legend: 'M3 = 4 semitones · m3 = 3 semitones',
  },
  sixths: {
    runs: SIXTHS_RUNS,
    color: '#FF9500',
    intro:
      'Diatonic sixths skip a string: the scale note sits on the lower string and its sixth ' +
      'rings on the string two above it. Mute the string in between. Major sixths (M6) sit at ' +
      'the same fret on both strings; minor sixths (m6) pull the top note back one fret.',
    legend: 'M6 = 9 semitones · m6 = 8 semitones',
  },
};

function pairLabel(run: IntervalRun): string {
  const upper = GUITAR_STRINGS[run.upperString].label;
  const lower = GUITAR_STRINGS[run.lowerString].label;
  return `${upper} + ${lower} strings`;
}

export default function IntervalsScreen() {
  const [section, setSection] = useState<Section>('thirds');
  const { runs, color, intro, legend } = SECTION[section];

  return (
    <View style={styles.container}>
      <View style={styles.segmentedWrapper}>
        <View style={styles.segmented}>
          {(Object.keys(SECTION_LABEL) as Section[]).map(s => (
            <Pressable
              key={s}
              style={[styles.segment, section === s && styles.segmentActive]}
              onPress={() => setSection(s)}
            >
              <Text style={[styles.segmentText, section === s && styles.segmentTextActive]}>
                {SECTION_LABEL[s]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introCard}>
          <Text style={styles.introText}>{intro}</Text>
          <Text style={styles.legend}>{legend}</Text>
        </View>
        {runs.map((run, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: color + '1A' }]}>
                <Text style={[styles.badgeText, { color }]}>{pairLabel(run)}</Text>
              </View>
              <Text style={styles.cardSubtitle}>One octave in C major</Text>
            </View>
            <IntervalRunView run={run} color={color} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  segmentedWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1, paddingVertical: 7, borderRadius: 8,
    alignItems: 'center', backgroundColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10, shadowRadius: 2, elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  segmentTextActive: { fontWeight: '600', color: '#1C1C1E' },
  scrollContent: { padding: 16, paddingTop: 4, gap: 14, paddingBottom: 40 },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  introText: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  legend: { fontSize: 12, color: '#AEAEB2', fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  cardSubtitle: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
});
