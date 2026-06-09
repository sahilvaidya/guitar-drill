import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import {
  CagedBox,
  IntervalRun,
  KeyMode,
  PENTATONIC_BOXES,
  SCALE_BOXES,
  SIXTHS_RUNS,
  THIRDS_RUNS,
  boxShapeName,
} from '@/domain/cagedShapes';
import { GUITAR_STRINGS } from '@/domain/guitarString';
import ScaleBoxDiagramView from '@/components/ScaleBoxDiagramView';
import IntervalRunView from '@/components/IntervalRunView';

type Section = 'pentatonic' | 'scale' | 'thirds' | 'sixths';

const SECTION_LABEL: Record<Section, string> = {
  pentatonic: 'Pentatonic',
  scale: 'Scale',
  thirds: '3rds',
  sixths: '6ths',
};

const MODE_COLOR: Record<KeyMode, string> = {
  major: '#007AFF',
  minor: '#5856D6',
};
const THIRDS_COLOR = '#34C759';
const SIXTHS_COLOR = '#FF9500';

const PENTATONIC_INTRO: Record<KeyMode, { formula: string; text: string }> = {
  major: {
    formula: '1 · 2 · 3 · 5 · 6',
    text:
      'C major pentatonic across the five CAGED boxes. Each box wraps around ' +
      'the chord shape it is named after, and the boxes tile the whole neck. ' +
      'Roots are solid; slide a box to play in any key.',
  },
  minor: {
    formula: '1 · ♭3 · 4 · 5 · ♭7',
    text:
      'A minor pentatonic — the same five boxes as C major pentatonic, only ' +
      'the root moves. Each box is named after the minor chord shape it wraps ' +
      'around. Roots are solid; slide a box to play in any key.',
  },
};

const SCALE_INTRO: Record<KeyMode, { formula: string; text: string }> = {
  major: {
    formula: '1 · 2 · 3 · 4 · 5 · 6 · 7',
    text:
      'The full C major scale in the five CAGED positions. These are the ' +
      'pentatonic boxes with the 4th and 7th added back in. Roots are solid.',
  },
  minor: {
    formula: '1 · 2 · ♭3 · 4 · 5 · ♭6 · ♭7',
    text:
      'A natural minor — identical fingerings to the C major positions, but ' +
      'the root (and every degree) sits in a different place. Roots are solid.',
  },
};

function ModeToggle({ mode, onChange }: { mode: KeyMode; onChange: (m: KeyMode) => void }) {
  return (
    <View style={styles.modeToggle}>
      {(['major', 'minor'] as KeyMode[]).map(m => (
        <Pressable
          key={m}
          style={[
            styles.modeOption,
            mode === m && { backgroundColor: MODE_COLOR[m] },
          ]}
          onPress={() => onChange(m)}
        >
          <Text style={[styles.modeOptionText, mode === m && styles.modeOptionTextActive]}>
            {m === 'major' ? 'Major' : 'Minor'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function BoxCard({
  box,
  position,
  mode,
  maxOffset,
}: {
  box: CagedBox;
  position: number;
  mode: KeyMode;
  maxOffset: number;
}) {
  const color = MODE_COLOR[mode];
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.shapeBadge, { backgroundColor: color + '1A' }]}>
          <Text style={[styles.shapeBadgeText, { color }]}>
            {boxShapeName(box, mode)} shape
          </Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Position {position} · frets {box.baseFret}–{box.baseFret + maxOffset}
        </Text>
      </View>
      <ScaleBoxDiagramView box={box} mode={mode} color={color} />
    </View>
  );
}

function BoxSection({
  boxes,
  mode,
  onModeChange,
  intro,
  exampleKey,
}: {
  boxes: CagedBox[];
  mode: KeyMode;
  onModeChange: (m: KeyMode) => void;
  intro: { formula: string; text: string };
  exampleKey: string;
}) {
  return (
    <>
      <ModeToggle mode={mode} onChange={onModeChange} />
      <View style={styles.introCard}>
        <Text style={styles.formula}>{intro.formula}</Text>
        <Text style={styles.introText}>{intro.text}</Text>
        <Text style={styles.exampleKey}>Example key: {exampleKey}</Text>
      </View>
      {boxes.map((box, i) => (
        <BoxCard
          key={box.majorShape}
          box={box}
          position={i + 1}
          mode={mode}
          maxOffset={Math.max(...box.frets.flat())}
        />
      ))}
    </>
  );
}

function pairLabel(run: IntervalRun): string {
  const upper = GUITAR_STRINGS[run.upperString].label;
  const lower = GUITAR_STRINGS[run.lowerString].label;
  return `${upper} + ${lower} strings`;
}

function RunSection({
  runs,
  color,
  intro,
  legend,
}: {
  runs: IntervalRun[];
  color: string;
  intro: string;
  legend: string;
}) {
  return (
    <>
      <View style={styles.introCard}>
        <Text style={styles.introText}>{intro}</Text>
        <Text style={styles.exampleKey}>{legend}</Text>
      </View>
      {runs.map((run, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.shapeBadge, { backgroundColor: color + '1A' }]}>
              <Text style={[styles.shapeBadgeText, { color }]}>{pairLabel(run)}</Text>
            </View>
            <Text style={styles.cardSubtitle}>One octave in C major</Text>
          </View>
          <IntervalRunView run={run} color={color} />
        </View>
      ))}
    </>
  );
}

export default function CagedScreen() {
  const [section, setSection] = useState<Section>('pentatonic');
  const [mode, setMode] = useState<KeyMode>('major');

  return (
    <View style={styles.container}>
      {/* Section segmented control */}
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
        {section === 'pentatonic' && (
          <BoxSection
            boxes={PENTATONIC_BOXES}
            mode={mode}
            onModeChange={setMode}
            intro={PENTATONIC_INTRO[mode]}
            exampleKey={mode === 'major' ? 'C major pentatonic' : 'A minor pentatonic'}
          />
        )}
        {section === 'scale' && (
          <BoxSection
            boxes={SCALE_BOXES}
            mode={mode}
            onModeChange={setMode}
            intro={SCALE_INTRO[mode]}
            exampleKey={mode === 'major' ? 'C major' : 'A natural minor'}
          />
        )}
        {section === 'thirds' && (
          <RunSection
            runs={THIRDS_RUNS}
            color={THIRDS_COLOR}
            intro={
              'Diatonic thirds on each adjacent pair of the first four strings. ' +
              'The bottom dot is the scale note, the top dot is the third above ' +
              'it in the key. The quality alternates between major (M3) and ' +
              'minor (m3) thirds as you walk up the scale.'
            }
            legend="M3 = 4 semitones · m3 = 3 semitones"
          />
        )}
        {section === 'sixths' && (
          <RunSection
            runs={SIXTHS_RUNS}
            color={SIXTHS_COLOR}
            intro={
              'Diatonic sixths skip a string: the scale note sits on the lower ' +
              'string and its sixth rings on the string two above it. Mute the ' +
              'string in between. Major sixths (M6) sit at the same fret on ' +
              'both strings; minor sixths (m6) pull the top note back one fret.'
            }
            legend="M6 = 9 semitones · m6 = 8 semitones"
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  // Section segmented control
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

  // Major/Minor toggle
  modeToggle: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    padding: 3,
    gap: 3,
  },
  modeOption: { paddingHorizontal: 18, paddingVertical: 5, borderRadius: 17 },
  modeOptionText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  modeOptionTextActive: { color: '#fff' },

  // Cards
  scrollContent: { padding: 16, paddingTop: 4, gap: 14, paddingBottom: 40 },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  formula: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', letterSpacing: 0.5 },
  introText: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  exampleKey: { fontSize: 12, color: '#AEAEB2', fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  shapeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  shapeBadgeText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  cardSubtitle: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
});
