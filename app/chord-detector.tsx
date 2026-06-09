import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, useWindowDimensions,
  Pressable, SafeAreaView, Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { FretPosition } from '@/domain/fretPosition';
import { GUITAR_STRINGS } from '@/domain/guitarString';
import {
  detectFromPositions, chordSymbol, pitchDisplayName,
  QUALITY_LABEL, QUALITY_SUFFIX,
} from '@/domain/chordDetect';
import FretboardView from '@/components/FretboardView';

const FRETBOARD_HEIGHT = 220;
const ROOT_COLOR = '#FF9500';
const NOTE_COLOR = '#007AFF';
const MAX_ALTERNATES = 3;

export default function ChordDetectorScreen() {
  const { width } = useWindowDimensions();
  const fretboardWidth = width - 32;

  // One fretted (or open) note per string: string index → fret
  const [selection, setSelection] = useState<ReadonlyMap<number, number>>(new Map());

  const onPositionTap = (pos: FretPosition) => {
    setSelection(prev => {
      const next = new Map(prev);
      if (next.get(pos.string.index) === pos.fret) {
        next.delete(pos.string.index); // tap again to mute the string
      } else {
        next.set(pos.string.index, pos.fret);
      }
      return next;
    });
  };

  const positions: FretPosition[] = [...selection.entries()]
    .sort(([a], [b]) => a - b)
    .map(([stringIndex, fret]) => ({ string: GUITAR_STRINGS[stringIndex], fret }));

  const matches = detectFromPositions(positions);
  const best = matches.length > 0 ? matches[0] : null;
  const alternates = matches.slice(1, 1 + MAX_ALTERNATES);

  const highlightedPositions = positions.map(pos => {
    const pc = (pos.string.openPitchClass + pos.fret) % 12;
    return {
      pos,
      color: best && pc === best.rootPc ? ROOT_COLOR : NOTE_COLOR,
      label: pitchDisplayName(pc),
    };
  });

  const noteNames = positions.map(pos =>
    pitchDisplayName((pos.string.openPitchClass + pos.fret) % 12),
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Chord Detector', headerBackTitle: 'Home' }} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.instruction}>
              Tap the fretboard to build a chord — one note per string, left of the
              nut for open strings. Tap a note again to mute the string.
            </Text>
          </View>

          <FretboardView
            width={fretboardWidth}
            height={FRETBOARD_HEIGHT}
            onPositionTap={onPositionTap}
            highlightedPositions={highlightedPositions}
          />

          {/* Result */}
          <View style={styles.card}>
            {selection.size === 0 ? (
              <Text style={styles.placeholder}>No notes selected yet</Text>
            ) : (
              <>
                <View style={styles.notePills}>
                  {positions.map((pos, i) => (
                    <View key={`${pos.string.index}-${pos.fret}`} style={styles.notePill}>
                      <Text style={styles.notePillString}>{pos.string.label}</Text>
                      <Text style={styles.notePillNote}>{noteNames[i]}</Text>
                    </View>
                  ))}
                </View>

                {best ? (
                  <>
                    <Text style={styles.chordSymbol}>{chordSymbol(best)}</Text>
                    <Text style={styles.chordQuality}>
                      {QUALITY_LABEL[best.quality]}
                      {best.omittedFifth ? ' · no 5th' : ''}
                      {best.bassPc !== best.rootPc
                        ? ` · ${pitchDisplayName(best.bassPc)} in the bass`
                        : ''}
                    </Text>
                    {alternates.length > 0 && (
                      <Text style={styles.alternates}>
                        Same notes as:{' '}
                        {alternates
                          .map(m => pitchDisplayName(m.rootPc) + QUALITY_SUFFIX[m.quality])
                          .join(', ')}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.placeholder}>
                    {selection.size < 3
                      ? 'Add more notes — chords need at least three'
                      : 'No match — not one of the essential chord shapes'}
                  </Text>
                )}
              </>
            )}
          </View>

          {selection.size > 0 && (
            <Pressable style={styles.clearButton} onPress={() => setSelection(new Map())}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

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
  instruction: { fontSize: 13, color: '#8E8E93', lineHeight: 19 },
  placeholder: { fontSize: 15, color: '#AEAEB2', textAlign: 'center', paddingVertical: 8 },

  notePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  notePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  notePillString: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  notePillNote: { fontSize: 13, color: '#1C1C1E', fontWeight: '700' },

  chordSymbol: { fontSize: 40, fontWeight: '800', color: '#1C1C1E', textAlign: 'center' },
  chordQuality: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginTop: 2 },
  alternates: { fontSize: 13, color: '#AEAEB2', textAlign: 'center', marginTop: 10 },

  clearButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  clearButtonText: { color: '#FF3B30', fontSize: 17, fontWeight: '600' },
});
