import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { KeyQuality, keyLabel } from '@/domain/chordNumberPractice';
import {
  PENTATONIC_FORMULA,
  bluesNote,
  pentatonicNotes,
  relativeLabel,
  rootFretOnString,
} from '@/domain/pentatonic';
import { PENTATONIC_BOXES, boxShapeName } from '@/domain/cagedShapes';
import { GUITAR_STRINGS } from '@/domain/guitarString';
import ScaleBoxDiagramView from '@/components/ScaleBoxDiagramView';

const QUALITY_COLOR: Record<KeyQuality, string> = {
  major: '#007AFF',
  minor: '#5856D6',
};

const ROOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const DESCRIPTION: Record<KeyQuality, string> = {
  major:
    'The major scale with the 4th and 7th removed — the two notes that clash with the chord. ' +
    'Sweet and open; the sound of country, folk and classic rock lead lines.',
  minor:
    'The natural minor scale without the 2nd and ♭6. Five notes that sound good over almost ' +
    'anything — the backbone of blues and rock soloing.',
};

// Box 1 in the canonical key: the Em-shape / G-shape box has its root on the low E string.
const BOX_INDEX: Record<KeyQuality, number> = { minor: 1, major: 2 };

export default function PentatonicScreen() {
  const [quality, setQuality] = useState<KeyQuality>('minor');
  const [root, setRoot] = useState(9);

  const color = QUALITY_COLOR[quality];
  const notes = pentatonicNotes(root, quality);
  const box = PENTATONIC_BOXES[BOX_INDEX[quality]];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.toggle}>
        {(['minor', 'major'] as KeyQuality[]).map(q => (
          <Pressable
            key={q}
            style={[styles.toggleOption, quality === q && { backgroundColor: QUALITY_COLOR[q] }]}
            onPress={() => setQuality(q)}
          >
            <Text style={[styles.toggleText, quality === q && styles.toggleTextActive]}>
              {q === 'minor' ? 'Minor' : 'Major'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rootScroll}
        contentContainerStyle={styles.rootRow}
      >
        {ROOTS.map(pc => (
          <Pressable
            key={pc}
            style={[styles.rootChip, root === pc && styles.rootChipActive]}
            onPress={() => setRoot(pc)}
          >
            <Text style={[styles.rootChipText, root === pc && styles.rootChipTextActive]}>
              {keyLabel(pc, quality).split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={[styles.title, { color }]}>{keyLabel(root, quality)} pentatonic</Text>
        <Text style={styles.formula}>{PENTATONIC_FORMULA[quality]}</Text>
        <Text style={styles.body}>{DESCRIPTION[quality]}</Text>
        <View style={styles.pills}>
          {notes.map((n, i) => (
            <View key={i} style={[styles.pill, { backgroundColor: color + '1A' }]}>
              <Text style={[styles.pillText, { color }]}>{n}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.body}>
          Relative {quality === 'major' ? 'minor' : 'major'}: {relativeLabel(root, quality)} — the
          same five notes, so one set of boxes covers both.
        </Text>
        {quality === 'minor' && (
          <Text style={styles.body}>
            Blues note: add the ♭5 ({bluesNote(root)}) as a passing tone to get the blues scale.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Finding the root</Text>
        <Text style={styles.body}>
          Root on the low E string: fret {rootFretOnString(0, root)}
          {rootFretOnString(0, root) === 0 ? ' (open / 12)' : ''}.{'\n'}
          Root on the A string: fret {rootFretOnString(1, root)}
          {rootFretOnString(1, root) === 0 ? ' (open / 12)' : ''}.{'\n\n'}
          Box 1 is the box that contains the low-E root, spanning about four frets. Every other
          box is the same five notes in a neighbouring position up or down the neck.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Box 1 · {boxShapeName(box, quality)} shape</Text>
        <Text style={styles.body}>
          Shown in {quality === 'minor' ? 'A minor' : 'C major'} (frets {box.baseFret}–
          {box.baseFret + Math.max(...box.frets.flat())}); slide it so the low-E root lands on
          your key. Solid dots are the root. See the CAGED page for all five boxes.
        </Text>
        <ScaleBoxDiagramView box={box} mode={quality} color={color} />
        <Text style={styles.footer}>
          Strings low → high: {GUITAR_STRINGS.map(s => s.label).join(' · ')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  toggleOption: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  toggleTextActive: { color: '#fff' },
  rootScroll: { flexGrow: 0 },
  rootRow: { gap: 8 },
  rootChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  rootChipActive: { backgroundColor: '#1C1C1E' },
  rootChipText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  rootChipTextActive: { color: '#fff' },
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
  title: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  formula: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', letterSpacing: 0.5 },
  body: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  footer: { fontSize: 12, color: '#AEAEB2' },
  pills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  pillText: { fontSize: 14, fontWeight: '700' },
});
