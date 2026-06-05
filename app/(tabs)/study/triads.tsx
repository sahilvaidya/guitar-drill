import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  TRIAD_QUALITIES,
  TRIAD_LABEL,
  TRIAD_FORMULA,
  TRIAD_DESCRIPTION,
  TRIAD_COLOR,
  triadNotes,
  TriadQuality,
} from '@/domain/triad';
import { TRIAD_SHAPES } from '@/domain/triadShapes';
import TriadDiagramView from '@/components/TriadDiagramView';

// C (pitch class 0) is used for the example notes row
const EXAMPLE_ROOT = 0;

type Section = 'reference' | 'practice';

function TriadCard({ quality }: { quality: TriadQuality }) {
  const color = TRIAD_COLOR[quality];
  const notes = triadNotes(EXAMPLE_ROOT, quality);
  const shapes = TRIAD_SHAPES[quality];

  return (
    <View style={styles.triadCard}>
      {/* Quality badge */}
      <View style={[styles.qualityBadge, { backgroundColor: color + '1A' }]}>
        <Text style={[styles.qualityLabel, { color }]}>{TRIAD_LABEL[quality]}</Text>
      </View>

      {/* Formula */}
      <Text style={styles.formula}>{TRIAD_FORMULA[quality]}</Text>

      {/* Description */}
      <Text style={styles.description}>{TRIAD_DESCRIPTION[quality]}</Text>

      {/* Example notes in C */}
      <View style={styles.exampleRow}>
        <Text style={styles.exampleLabel}>Example (C):</Text>
        <View style={styles.notePills}>
          {notes.map((note, i) => (
            <View key={i} style={[styles.notePill, { backgroundColor: color + '1A' }]}>
              <Text style={[styles.notePillText, { color }]}>{note}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Shape diagrams */}
      <View style={[styles.shapesDivider, { backgroundColor: color + '30' }]} />
      <Text style={[styles.shapesHeader, { color }]}>Strings G · B · e</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.diagramsRow}
      >
        {shapes.map((shape, i) => (
          <TriadDiagramView key={i} shape={shape} color={color} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function TriadsScreen() {
  const [section, setSection] = useState<Section>('reference');

  return (
    <View style={styles.container}>
      {/* Segmented control */}
      <View style={styles.segmentedWrapper}>
        <View style={styles.segmented}>
          {(['reference', 'practice'] as Section[]).map(s => (
            <Pressable
              key={s}
              style={[styles.segment, section === s && styles.segmentActive]}
              onPress={() => setSection(s)}
            >
              <Text style={[styles.segmentText, section === s && styles.segmentTextActive]}>
                {s === 'reference' ? 'Reference' : 'Practice'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content */}
      {section === 'reference' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {TRIAD_QUALITIES.map(quality => (
            <TriadCard key={quality} quality={quality} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.practiceShell}>
          <Text style={styles.practiceTitle}>Triad Practice</Text>
          <Text style={styles.practiceSubtitle}>
            Interactive drills for triads are coming soon.{'\n'}
            You'll be able to drill triad spelling, shape recognition, and fretboard placement.
          </Text>
          {/* TODO: drill modes — triad spelling, shape recognition, fretboard placement */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  // Segmented control
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

  // Triad cards
  scrollContent: { padding: 16, paddingTop: 0, gap: 14, paddingBottom: 40 },
  triadCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: 8,
  },
  qualityBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  qualityLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  formula: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', letterSpacing: 0.5 },
  description: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  exampleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  exampleLabel: { fontSize: 13, color: '#8E8E93' },
  notePills: { flexDirection: 'row', gap: 6 },
  notePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  notePillText: { fontSize: 13, fontWeight: '600' },

  // Shapes section
  shapesDivider: { height: 1, marginHorizontal: -16 },
  shapesHeader: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
    textTransform: 'uppercase', marginTop: 2,
  },
  diagramsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 4,
  },

  // Practice shell
  practiceShell: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12,
  },
  practiceTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', textAlign: 'center' },
  practiceSubtitle: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
});
