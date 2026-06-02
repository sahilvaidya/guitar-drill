import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChipProps {
  label: string;
  value: string | number;
  valueColor?: string;
}

export function StatChip({ label, value, valueColor }: ChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

interface ChipRowProps {
  children: React.ReactNode;
}

export function ChipRow({ children }: ChipRowProps) {
  return <View style={styles.row}>{children}</View>;
}

function timingColor(seconds: number): string {
  return seconds < 5 ? '#28A745' : '#DC3545';
}

export function TimingChip({ label, seconds }: { label: string; seconds: number | null }) {
  if (seconds === null) return null;
  return (
    <StatChip
      label={label}
      value={`${seconds.toFixed(1)}s`}
      valueColor={timingColor(seconds)}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 56,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: '#1C1C1E',
  },
  label: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
