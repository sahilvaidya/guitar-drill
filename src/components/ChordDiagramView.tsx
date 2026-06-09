import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { Barre } from '@/domain/chordShapes';
import { GUITAR_STRINGS } from '@/domain/guitarString';

// ─── Layout constants (classic vertical chord chart) ─────────────────────────

const N_STRINGS = 6;
const N_FRETS = 4;        // fret rows shown
const STR_GAP = 15;
const FRET_H = 19;
const DOT_R = 6.5;
const PAD_L = 20;         // room for the "5fr" base-fret label
const PAD_R = 10;
const PAD_T = 17;         // room for X / O markers
const PAD_B = 5;

const W = PAD_L + (N_STRINGS - 1) * STR_GAP + PAD_R;
const H = PAD_T + N_FRETS * FRET_H + PAD_B;

const NOTE_COLOR = '#007AFF';
const ROOT_COLOR = '#FF9500';

function stringX(i: number): number {
  return PAD_L + i * STR_GAP;
}

function rowY(row: number): number {
  return PAD_T + (row + 0.5) * FRET_H;
}

interface Props {
  /** Per string low E → high e: -1 muted, 0 open, n = absolute fret. */
  frets: number[];
  fingers?: number[];
  barre?: Barre;
  /** Fret shown as the first row; 1 draws the nut. */
  baseFret?: number;
  rootPc: number;
  /** Chord symbol shown below the chart. */
  name: string;
  /** Smaller second line, e.g. 'E shape'. */
  sublabel?: string;
}

export default function ChordDiagramView({
  frets,
  fingers,
  barre,
  baseFret = 1,
  rootPc,
  name,
  sublabel,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Svg width={W} height={H}>
        {/* Nut or base-fret label */}
        {baseFret === 1 ? (
          <Rect
            x={PAD_L - 1} y={PAD_T - 3}
            width={(N_STRINGS - 1) * STR_GAP + 2} height={3}
            fill="rgba(0,0,0,0.7)"
          />
        ) : (
          <SvgText
            x={PAD_L - 6} y={rowY(0) + 3}
            fontSize={9} fontWeight="600"
            fill="rgba(0,0,0,0.4)" textAnchor="end"
          >
            {baseFret}
          </SvgText>
        )}

        {/* Fret lines */}
        {Array.from({ length: N_FRETS + 1 }, (_, k) => (
          <Line
            key={k}
            x1={PAD_L} y1={PAD_T + k * FRET_H}
            x2={PAD_L + (N_STRINGS - 1) * STR_GAP} y2={PAD_T + k * FRET_H}
            stroke="rgba(0,0,0,0.18)" strokeWidth={1}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: N_STRINGS }, (_, i) => (
          <Line
            key={i}
            x1={stringX(i)} y1={PAD_T}
            x2={stringX(i)} y2={PAD_T + N_FRETS * FRET_H}
            stroke="rgba(0,0,0,0.25)" strokeWidth={1}
          />
        ))}

        {/* X / O markers above the nut */}
        {frets.map((fret, i) =>
          fret > 0 ? null : (
            <SvgText
              key={i}
              x={stringX(i)} y={PAD_T - 7}
              fontSize={9} fontWeight="700"
              fill={
                fret === 0 && (GUITAR_STRINGS[i].openPitchClass === rootPc)
                  ? ROOT_COLOR
                  : 'rgba(0,0,0,0.4)'
              }
              textAnchor="middle"
            >
              {fret === 0 ? 'O' : '✕'}
            </SvgText>
          ),
        )}

        {/* Barre bar (drawn under the dots) */}
        {barre && (
          <Rect
            x={stringX(barre.fromString) - DOT_R}
            y={rowY(barre.fret - baseFret) - DOT_R * 0.85}
            width={(barre.toString - barre.fromString) * STR_GAP + DOT_R * 2}
            height={DOT_R * 1.7}
            rx={DOT_R * 0.85}
            fill={NOTE_COLOR + '55'}
          />
        )}

        {/* Dots */}
        {frets.map((fret, i) => {
          if (fret <= 0) return null;
          const row = fret - baseFret;
          if (row < 0 || row >= N_FRETS) return null;
          const pc = (GUITAR_STRINGS[i].openPitchClass + fret) % 12;
          const isRoot = pc === rootPc;
          const finger = fingers?.[i] ?? 0;
          return (
            <React.Fragment key={i}>
              <Circle
                cx={stringX(i)} cy={rowY(row)} r={DOT_R}
                fill={isRoot ? ROOT_COLOR : NOTE_COLOR}
              />
              {finger > 0 && (
                <SvgText
                  x={stringX(i)} y={rowY(row) + 3.2}
                  fontSize={9} fontWeight="700"
                  fill="#fff" textAnchor="middle"
                >
                  {finger}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>

      <Text style={styles.name}>{name}</Text>
      {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', width: W },
  name: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', marginTop: 2 },
  sublabel: { fontSize: 10, color: '#8E8E93', marginTop: 1 },
});
