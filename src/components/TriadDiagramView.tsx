import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { TriadShape, NOTE_ROLE_LABEL, NoteRole } from '@/domain/triadShapes';

// ─── Layout constants ────────────────────────────────────────────────────────

const W = 108;          // total SVG width
const H = 78;           // total SVG height
const LABEL_W = 18;     // left column for string labels (e, B, G)
const PAD_R = 6;        // right padding
const PAD_T = 10;       // top padding
const PAD_B = 10;       // bottom padding
const N_FRET_SPACES = 4;
const N_STRINGS = 3;
const DOT_R = 9;        // dot radius

const boardW = W - LABEL_W - PAD_R;          // 84
const boardH = H - PAD_T - PAD_B;            // 58
const fretW = boardW / N_FRET_SPACES;         // 21
const strGap = boardH / (N_STRINGS - 1);      // 29

// String y-positions in display order: top = e (highest pitch), bottom = G (lowest)
// Shape array indices: 0=G, 1=B, 2=e
// Display indices:     0=e (top), 1=B (mid), 2=G (bottom)
// → displayIndex = 2 - shapeIndex
const STRING_Y = [
  PAD_T,              // high string (shape index 2) → display index 0
  PAD_T + strGap,     // mid string (shape index 1) → display index 1
  PAD_T + 2 * strGap, // low string (shape index 0) → display index 2
];

function dotX(offset: number) {
  return LABEL_W + (offset + 0.5) * fretW;
}

function dotY(shapeIndex: number) {
  // shapeIndex 0=G→bottom(2), 1=B→mid(1), 2=e→top(0)
  const displayIndex = 2 - shapeIndex;
  return STRING_Y[displayIndex];
}

// ─── Colour helpers ──────────────────────────────────────────────────────────

function dotFill(role: NoteRole, qualityColor: string): string {
  return role === 'R' ? qualityColor : qualityColor + '28'; // root = solid, others = 16% tint
}

function dotTextColor(role: NoteRole, qualityColor: string): string {
  return role === 'R' ? '#fff' : qualityColor;
}

function labelFontSize(label: string): number {
  return label.length > 1 ? 7 : 9; // '♭3', '♯5' etc. need smaller size
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  shape: TriadShape;
  /** Quality colour used for dot fill / tint */
  color: string;
  /** String names, low to high pitch — matches shape.offsets/roles order */
  strings: [string, string, string];
  /** When set, shown under the diagram as the fret the shape starts on */
  baseFret?: number;
}

export default function TriadDiagramView({ shape, color, strings, baseFret }: Props) {
  // Display order is top→bottom = high string → low string
  const stringLabels = [strings[2], strings[1], strings[0]];

  return (
    <View style={styles.wrapper}>
      <Svg width={W} height={H}>
        {/* Card background */}
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#F9F9F9" />

        {/* String labels */}
        {stringLabels.map((label, di) => (
          <SvgText
            key={label}
            x={LABEL_W / 2}
            y={STRING_Y[di] + 4}
            fontSize={10}
            fontWeight="500"
            fill="rgba(0,0,0,0.4)"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}

        {/* String lines */}
        {STRING_Y.map((y, di) => (
          <Line
            key={di}
            x1={LABEL_W} y1={y}
            x2={W - PAD_R} y2={y}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={1.5}
          />
        ))}

        {/* Fret lines */}
        {Array.from({ length: N_FRET_SPACES + 1 }, (_, i) => {
          const x = LABEL_W + i * fretW;
          const isLeft = i === 0;
          return (
            <Line
              key={i}
              x1={x} y1={PAD_T - 4}
              x2={x} y2={PAD_T + boardH + 4}
              stroke={isLeft ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.10)'}
              strokeWidth={isLeft ? 2 : 1}
            />
          );
        })}

        {/* Dots */}
        {shape.offsets.map((offset, si) => {
          const role = shape.roles[si];
          const cx = dotX(offset);
          const cy = dotY(si);
          const fill = dotFill(role, color);
          const textColor = dotTextColor(role, color);
          const label = NOTE_ROLE_LABEL[role];
          const fontSize = labelFontSize(label);

          return (
            <React.Fragment key={si}>
              <Circle cx={cx} cy={cy} r={DOT_R} fill={fill} />
              {role === 'R' && (
                <Circle
                  cx={cx} cy={cy} r={DOT_R}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                />
              )}
              <SvgText
                x={cx}
                y={cy + fontSize * 0.38}
                fontSize={fontSize}
                fontWeight="700"
                fill={textColor}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Inversion label */}
      <Text style={styles.label}>{shape.label}</Text>
      {baseFret !== undefined && (
        <Text style={[styles.label, styles.fretLabel]}>
          {baseFret === 0 ? 'open pos.' : `from fret ${baseFret}`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  fretLabel: { color: '#1C1C1E', fontWeight: '600', marginTop: -2 },
});
