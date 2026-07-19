import React from 'react';
import {
  View, Text, Switch, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { Stack } from 'expo-router';
import { usePracticeSession } from '@/store/usePracticeSession';
import { clampedFretRange } from '@/domain/fretRange';
import { GUITAR_STRINGS, GuitarStringName } from '@/domain/guitarString';

const STRING_DISPLAY_LABEL: Record<GuitarStringName, string> = {
  lowE: 'Low E (6th)',
  A: 'A (5th)',
  D: 'D (4th)',
  G: 'G (3rd)',
  B: 'B (2nd)',
  highE: 'High E (1st)',
};

function Stepper({
  value, min, max, onChange,
}: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.stepperRow}>
      <Pressable
        style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
        onPress={() => value > min && onChange(value - 1)}
        disabled={value <= min}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable
        style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
        onPress={() => value < max && onChange(value + 1)}
        disabled={value >= max}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

export default function SettingsScreen() {
  const {
    mode, fretRange, enabledStrings, recentMisses, setMode, setFretRange, setEnabledStrings,
  } = usePracticeSession();

  const toggleString = (name: GuitarStringName, isEnabled: boolean) => {
    if (!isEnabled && enabledStrings.length <= 1) return;
    const next = isEnabled
      ? [...enabledStrings, name]
      : enabledStrings.filter(s => s !== name);
    setEnabledStrings(next);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Settings', presentation: 'modal' }} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Practice mode */}
          <Text style={styles.sectionHeader}>Practice Mode</Text>
          <View style={styles.card}>
            <View style={styles.segmented}>
              {(['natural', 'chromatic'] as const).map(m => (
                <Pressable
                  key={m}
                  style={[styles.segment, mode === m && styles.segmentActive]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[styles.segmentText, mode === m && styles.segmentTextActive]}>
                    {m === 'natural' ? 'Natural' : 'Chromatic'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Fret range */}
          <Text style={styles.sectionHeader}>Fret Range</Text>
          <View style={styles.card}>
            <View style={styles.rangeRow}>
              <Text style={styles.rangeLabel}>Start</Text>
              <Stepper
                value={fretRange.start}
                min={0}
                max={fretRange.end}
                onChange={v => setFretRange(clampedFretRange(v, fretRange.end))}
              />
            </View>
            <View style={[styles.rangeRow, styles.rangeRowBorder]}>
              <Text style={styles.rangeLabel}>End</Text>
              <Stepper
                value={fretRange.end}
                min={fretRange.start}
                max={12}
                onChange={v => setFretRange(clampedFretRange(fretRange.start, v))}
              />
            </View>
          </View>

          {/* Strings */}
          <Text style={styles.sectionHeader}>Strings</Text>
          <View style={styles.card}>
            {GUITAR_STRINGS.map((s, i) => {
              const isEnabled = enabledStrings.includes(s.name);
              return (
                <View key={s.name} style={[styles.rangeRow, i > 0 && styles.rangeRowBorder]}>
                  <Text style={styles.rangeLabel}>{STRING_DISPLAY_LABEL[s.name]}</Text>
                  <Switch
                    value={isEnabled}
                    onValueChange={v => toggleString(s.name, v)}
                    disabled={isEnabled && enabledStrings.length <= 1}
                  />
                </View>
              );
            })}
          </View>

          {/* Recent misses */}
          <Text style={styles.sectionHeader}>Recent Misses</Text>
          <View style={styles.card}>
            {recentMisses.length === 0 ? (
              <Text style={styles.emptyText}>No misses yet</Text>
            ) : (
              recentMisses.map((miss, i) => {
                const stringDef = GUITAR_STRINGS[miss.position.stringIndex];
                const label = `${stringDef?.label ?? '?'} string, fret ${miss.position.fret}`;
                return (
                  <View key={i} style={[styles.missRow, i > 0 && styles.missRowBorder]}>
                    <Text style={styles.missPosition}>{label}</Text>
                    <Text style={styles.missDetail}>
                      Correct: <Text style={styles.missCorrect}>{miss.correct}</Text>
                      {'  '}Selected: <Text style={styles.missIncorrect}>{miss.selected}</Text>
                    </Text>
                  </View>
                );
              })
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionHeader: {
    fontSize: 13, fontWeight: '600', color: '#8E8E93',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 8, marginBottom: 4, marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  segmented: { flexDirection: 'row', padding: 4, gap: 4 },
  segment: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    alignItems: 'center', backgroundColor: 'transparent',
  },
  segmentActive: { backgroundColor: '#007AFF' },
  segmentText: { fontSize: 15, fontWeight: '500', color: '#1C1C1E' },
  segmentTextActive: { color: '#fff' },

  rangeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
  },
  rangeRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA' },
  rangeLabel: { fontSize: 15, color: '#1C1C1E' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { backgroundColor: '#E5E5EA' },
  stepBtnText: { fontSize: 20, fontWeight: '600', color: '#fff', lineHeight: 22 },
  stepValue: { fontSize: 17, fontWeight: '600', color: '#1C1C1E', minWidth: 24, textAlign: 'center' },

  emptyText: { fontSize: 14, color: '#8E8E93', padding: 16 },
  missRow: { padding: 16 },
  missRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA' },
  missPosition: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 2 },
  missDetail: { fontSize: 13, color: '#8E8E93' },
  missCorrect: { color: '#28A745', fontWeight: '600' },
  missIncorrect: { color: '#DC3545', fontWeight: '600' },
});
