import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import {
  ChordShape, MoveableChordShape,
  OPEN_CHORDS, OPEN_SEVENTH_CHORDS, SUS_CHORDS,
  BARRE_6TH_SHAPES, BARRE_5TH_SHAPES, POWER_CHORD_SHAPES,
  rootFretFor, transposedFrets, moveableChordName,
} from '@/domain/chordShapes';
import { pitchDisplayName } from '@/domain/chordDetect';
import ChordDiagramView from '@/components/ChordDiagramView';

const ALL_ROOTS = Array.from({ length: 12 }, (_, pc) => pc);
// Chip order starting from C: C C# D Eb E F F# G Ab A Bb B
const DEFAULT_ROOT = 5; // F — the classic first barre chord

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      <View style={styles.diagramGrid}>{children}</View>
    </View>
  );
}

function OpenChordSection({
  title,
  subtitle,
  shapes,
}: {
  title: string;
  subtitle?: string;
  shapes: ChordShape[];
}) {
  return (
    <SectionCard title={title} subtitle={subtitle}>
      {shapes.map(shape => (
        <ChordDiagramView
          key={shape.label}
          frets={shape.frets}
          fingers={shape.fingers}
          barre={shape.barre}
          baseFret={1}
          rootPc={shape.rootPc}
          name={shape.label}
        />
      ))}
    </SectionCard>
  );
}

function MoveableChordSection({
  title,
  subtitle,
  shapes,
  rootPc,
}: {
  title: string;
  subtitle?: string;
  shapes: MoveableChordShape[];
  rootPc: number;
}) {
  return (
    <SectionCard title={title} subtitle={subtitle}>
      {shapes.map(shape => {
        const rootFret = rootFretFor(shape, rootPc);
        return (
          <ChordDiagramView
            key={shape.suffix + shape.shapeName}
            frets={transposedFrets(shape, rootFret)}
            fingers={shape.fingers}
            barre={shape.barre && { ...shape.barre, fret: rootFret }}
            baseFret={rootFret}
            rootPc={rootPc}
            name={moveableChordName(shape, rootPc)}
            sublabel={shape.shapeName}
          />
        );
      })}
    </SectionCard>
  );
}

export default function ChordsScreen() {
  const [rootPc, setRootPc] = useState(DEFAULT_ROOT);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        The essential chord shapes. Root notes are orange; numbers show a standard
        fingering. Moveable shapes follow the root you pick below.
      </Text>

      <OpenChordSection
        title="Open Chords"
        subtitle="The first-position staples"
        shapes={OPEN_CHORDS}
      />
      <OpenChordSection
        title="Open 7th Chords"
        subtitle="Dominant 7ths in open position"
        shapes={OPEN_SEVENTH_CHORDS}
      />
      <OpenChordSection
        title="Suspended Chords"
        subtitle="The 3rd swapped for a 2nd or 4th — neither major nor minor"
        shapes={SUS_CHORDS}
      />

      {/* Root picker for the moveable sections */}
      <View style={styles.pickerCard}>
        <Text style={styles.pickerLabel}>Moveable shapes · root note</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pickerRow}>
            {ALL_ROOTS.map(pc => (
              <Pressable
                key={pc}
                style={[styles.rootChip, rootPc === pc && styles.rootChipActive]}
                onPress={() => setRootPc(pc)}
              >
                <Text style={[styles.rootChipText, rootPc === pc && styles.rootChipTextActive]}>
                  {pitchDisplayName(pc)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <MoveableChordSection
        title="Barre Chords · Root on 6th String"
        subtitle="E-family shapes — the barre replaces the nut"
        shapes={BARRE_6TH_SHAPES}
        rootPc={rootPc}
      />
      <MoveableChordSection
        title="Barre Chords · Root on 5th String"
        subtitle="A-family shapes"
        shapes={BARRE_5TH_SHAPES}
        rootPc={rootPc}
      />
      <MoveableChordSection
        title="Power Chords"
        subtitle="Root + fifth — neither major nor minor, made for distortion"
        shapes={POWER_CHORD_SHAPES}
        rootPc={rootPc}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  intro: { fontSize: 13, color: '#8E8E93', lineHeight: 19, marginHorizontal: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  sectionSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  diagramGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginTop: 14,
  },

  pickerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  pickerLabel: {
    fontSize: 11, fontWeight: '700', color: '#8E8E93',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  pickerRow: { flexDirection: 'row', gap: 6 },
  rootChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  rootChipActive: { backgroundColor: '#007AFF' },
  rootChipText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  rootChipTextActive: { color: '#fff' },
});
