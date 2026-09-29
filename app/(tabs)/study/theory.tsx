import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import CircleOfFifthsView from '@/components/CircleOfFifthsView';
import {
  CIRCLE_OF_FIFTHS,
  FLAT_ORDER,
  SCALES,
  SHARP_ORDER,
  THEORY_ROOTS,
  degreeFormula,
  keySignature,
  scaleById,
  signatureLabel,
  spellScale,
  stepPattern,
} from '@/domain/musicTheory';

type Section = 'majorMinor' | 'circle' | 'scales';

const SECTION_LABEL: Record<Section, string> = {
  majorMinor: 'Major / Minor',
  circle: 'Circle of 5ths',
  scales: 'Build Scales',
};

const MAJOR_COLOR = '#007AFF';
const MINOR_COLOR = '#5856D6';
const CIRCLE_COLOR = '#FF9500';

const show = (note: string) => note.replace(/#/g, '♯').replace(/([A-G])b/g, '$1♭');

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Pills({ notes, color }: { notes: string[]; color: string }) {
  return (
    <View style={styles.pills}>
      {notes.map((n, i) => (
        <View key={i} style={[styles.pill, { backgroundColor: color + '1A' }]}>
          <Text style={[styles.pillText, { color }]}>{show(n)}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Major vs minor ──────────────────────────────────────────────────────────

function MajorMinorSection() {
  const major = scaleById('major');
  const minor = scaleById('naturalMinor');
  return (
    <>
      <Card>
        <Text style={styles.title}>The big split</Text>
        <Text style={styles.body}>
          Almost all Western music sits in one of two families. What separates them is one note:
          the 3rd. A major 3rd (4 half steps above the root) sounds bright and settled; a minor
          3rd (3 half steps) sounds darker and more serious. That single note decides whether a
          chord is major or minor, and the same note colours the whole scale built on it.
        </Text>
      </Card>

      <Card>
        <Text style={[styles.title, { color: MAJOR_COLOR }]}>Major</Text>
        <Text style={styles.formula}>W W H W W W H</Text>
        <Text style={styles.body}>1 2 3 4 5 6 7 — the reference scale. C major:</Text>
        <Pills notes={spellScale('C', major)} color={MAJOR_COLOR} />
        <Text style={styles.body}>Chords built on each degree:</Text>
        <Text style={styles.chords}>I  ii  iii  IV  V  vi  vii°</Text>
      </Card>

      <Card>
        <Text style={[styles.title, { color: MINOR_COLOR }]}>Natural minor</Text>
        <Text style={styles.formula}>W H W W H W W</Text>
        <Text style={styles.body}>1 2 ♭3 4 5 ♭6 ♭7 — major with the 3rd, 6th and 7th lowered. C minor:</Text>
        <Pills notes={spellScale('C', minor)} color={MINOR_COLOR} />
        <Text style={styles.body}>Chords built on each degree:</Text>
        <Text style={styles.chords}>i  ii°  III  iv  v  VI  VII</Text>
      </Card>

      <Card>
        <Text style={styles.title}>Relative vs parallel</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Relative</Text> keys share every note but start in a
          different place. Start the major scale on its 6th degree and you get its relative
          minor: C major and A minor use the same seven notes (no sharps or flats). The relative
          minor is always 3 half steps below the major.
        </Text>
        <Pills notes={spellScale('A', minor)} color={MINOR_COLOR} />
        <Text style={styles.body}>
          <Text style={styles.bold}>Parallel</Text> keys share a root but not the notes: C major
          vs C minor. Switching between them changes exactly the 3rd, 6th and 7th — the fastest
          way to hear the mood shift.
        </Text>
      </Card>
    </>
  );
}

// ─── Circle of fifths ────────────────────────────────────────────────────────

function CircleSection() {
  const [selected, setSelected] = useState(0);
  const key = CIRCLE_OF_FIFTHS[selected];
  const signature = keySignature(key);
  const rootName = key.position === 6 ? 'F♯ / G♭' : show(key.major);
  return (
    <>
      <Card>
        <Text style={styles.title}>The circle of fifths</Text>
        <Text style={styles.body}>
          All twelve keys arranged so that each step clockwise moves up a perfect 5th (7 half
          steps). The outer ring is the major key, the inner ring its relative minor. Neighbours
          differ by only one note, which is why they sound closely related and why songs modulate
          to them so easily.
        </Text>
        <View style={styles.circleWrap}>
          <CircleOfFifthsView selected={selected} onSelect={setSelected} color={CIRCLE_COLOR} />
        </View>
      </Card>

      <Card>
        <Text style={[styles.title, { color: CIRCLE_COLOR }]}>
          {rootName} major · {show(key.minor)} minor
        </Text>
        <Text style={styles.body}>
          Key signature: {signatureLabel(key)}
          {signature.length > 0 ? ` (${signature.map(show).join(' ')})` : ''}
        </Text>
        <Text style={styles.body}>
          Neighbours: a 5th up is {show(CIRCLE_OF_FIFTHS[(selected + 1) % 12].major)}, a 5th down
          (a 4th up) is {show(CIRCLE_OF_FIFTHS[(selected + 11) % 12].major)}.
        </Text>
        <Text style={styles.hint}>Tap any key on the circle.</Text>
      </Card>

      <Card>
        <Text style={styles.title}>How to read it</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Clockwise adds a sharp.</Text> Going up a 5th raises the 7th
          degree of the new key by a half step. Sharps always appear in this order:
        </Text>
        <Pills notes={SHARP_ORDER.map(l => `${l}#`)} color={MAJOR_COLOR} />
        <Text style={styles.body}>
          <Text style={styles.bold}>Counter-clockwise adds a flat</Text> (going up a 4th). Flats
          come in the reverse order:
        </Text>
        <Pills notes={FLAT_ORDER.map(l => `${l}b`)} color={MINOR_COLOR} />
        <Text style={styles.body}>
          Reading a signature: in a sharp key the major tonic is a half step above the last sharp
          (D major has F♯ C♯ → C♯ + half step = D). In a flat key the tonic is the second-to-last
          flat (Eb major has B♭ E♭ A♭ → E♭). F major, with one flat, is the exception.
          {'\n\n'}
          Also handy: the chords I, IV and V of a key are a key and its two neighbours on the
          circle. In C that is C, F and G.
        </Text>
      </Card>
    </>
  );
}

// ─── Building scales ─────────────────────────────────────────────────────────

function ScalesSection() {
  const [root, setRoot] = useState('C');
  return (
    <>
      <Card>
        <Text style={styles.title}>Build any scale</Text>
        <Text style={styles.body}>
          A scale is a recipe of half steps (H = 1 fret) and whole steps (W = 2 frets). Apply the
          recipe from any root and you get that scale in that key. Then name the notes with one
          letter per degree (A B C D E F G, no repeats), adding ♯ or ♭ as needed — that is why
          F♯ major contains E♯, not F.
          {'\n\n'}
          The easy way to remember most of them is to compare with major: the degrees shown below
          (like ♭3 or ♭7) are the notes you change.
        </Text>
      </Card>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rootScroll}
        contentContainerStyle={styles.rootRow}
      >
        {THEORY_ROOTS.map(r => (
          <Pressable
            key={r}
            style={[styles.rootChip, root === r && styles.rootChipActive]}
            onPress={() => setRoot(r)}
          >
            <Text style={[styles.rootChipText, root === r && styles.rootChipTextActive]}>
              {show(r)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {SCALES.map(scale => {
        const isMinorish = degreeFormula(scale).some(d => d.startsWith('♭3'));
        const color = isMinorish ? MINOR_COLOR : MAJOR_COLOR;
        return (
          <Card key={scale.id}>
            <Text style={[styles.title, { color }]}>
              {show(root)} {scale.label.toLowerCase()}
            </Text>
            <Text style={styles.body}>{scale.description}</Text>
            <Text style={styles.formula}>{stepPattern(scale).join(' ')}</Text>
            <Text style={styles.degrees}>{degreeFormula(scale).join(' · ')}</Text>
            <Pills notes={spellScale(root, scale)} color={color} />
          </Card>
        );
      })}
    </>
  );
}

export default function TheoryScreen() {
  const [section, setSection] = useState<Section>('majorMinor');

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
        {section === 'majorMinor' && <MajorMinorSection />}
        {section === 'circle' && <CircleSection />}
        {section === 'scales' && <ScalesSection />}
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
  segmentText: { fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
  segmentTextActive: { fontWeight: '600', color: '#1C1C1E' },
  scrollContent: { padding: 16, paddingTop: 4, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  body: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  bold: { fontWeight: '700', color: '#3A3A3C' },
  hint: { fontSize: 12, color: '#AEAEB2' },
  formula: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', letterSpacing: 1 },
  degrees: { fontSize: 14, fontWeight: '600', color: '#3A3A3C' },
  chords: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', letterSpacing: 1 },
  pills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12 },
  pillText: { fontSize: 14, fontWeight: '700' },
  circleWrap: { alignItems: 'center' },
  rootScroll: { flexGrow: 0 },
  rootRow: { gap: 8, paddingBottom: 2 },
  rootChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: '#E5E5EA',
  },
  rootChipActive: { backgroundColor: '#1C1C1E' },
  rootChipText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  rootChipTextActive: { color: '#fff' },
});
