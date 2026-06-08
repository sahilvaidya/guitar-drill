import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { GuitarStringDef } from '@/domain/guitarString';
import { FretPosition } from '@/domain/fretPosition';

interface HighlightedPosition {
  pos: FretPosition;
  color: string;
}

interface Props {
  windowStrings: GuitarStringDef[];   // 3 strings, ascending by index
  windowFrets: number[];               // 4 frets
  onPositionTap?: (pos: FretPosition) => void;
  highlightedPositions?: HighlightedPosition[];
  width: number;
  height: number;
}

const LEFT_INSET = 38;
const RIGHT_INSET = 8;
const TOP_INSET = 26;
const BOTTOM_INSET = 8;

function useLayout(width: number, height: number, numFrets: number, numStrings: number) {
  const innerW = width - LEFT_INSET - RIGHT_INSET;
  const innerH = height - TOP_INSET - BOTTOM_INSET;
  const cellW = innerW / numFrets;
  const cellH = innerH / (numStrings - 1);

  // Strings display high→low (highest index at top), so reverse the display order
  function yForDisplayRow(row: number): number {
    return TOP_INSET + row * cellH;
  }

  function xForFretSlot(slotIdx: number): number {
    return LEFT_INSET + (slotIdx + 0.5) * cellW;
  }

  return { cellW, cellH, yForDisplayRow, xForFretSlot, innerW, innerH };
}

export default function ZoomedFretboardView({
  windowStrings,
  windowFrets,
  onPositionTap,
  highlightedPositions,
  width,
  height,
}: Props) {
  const numFrets = windowFrets.length;
  const numStrings = windowStrings.length;
  const l = useLayout(width, height, numFrets, numStrings);

  // Display order: highest string index at top
  const displayStrings = [...windowStrings].reverse();

  const isNutVisible = windowFrets[0] === 0;

  function displayRowForString(s: GuitarStringDef): number {
    return displayStrings.findIndex(ds => ds.index === s.index);
  }

  return (
    <View style={[styles.container, { width, height }]}>
      {/* SVG: visual rendering only — no touch events */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        {/* background */}
        <Rect x={0} y={0} width={width} height={height} rx={14} fill="#fff" />

        {/* fret lines */}
        {Array.from({ length: numFrets + 1 }, (_, i) => {
          const x = LEFT_INSET + i * l.cellW;
          const isNut = isNutVisible && i === 0;
          return (
            <Line
              key={i}
              x1={x} y1={TOP_INSET - 4}
              x2={x} y2={height - BOTTOM_INSET + 4}
              stroke={isNut ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.14)'}
              strokeWidth={isNut ? 4 : 1}
            />
          );
        })}

        {/* string lines */}
        {displayStrings.map((s, row) => {
          const y = l.yForDisplayRow(row);
          return (
            <React.Fragment key={s.name}>
              <Line
                x1={LEFT_INSET} y1={y}
                x2={width - RIGHT_INSET} y2={y}
                stroke="rgba(0,0,0,0.2)" strokeWidth={2}
              />
              <SvgText
                x={LEFT_INSET / 2} y={y + 4}
                fontSize={12} fontWeight="600"
                fill="rgba(0,0,0,0.5)"
                textAnchor="middle"
              >
                {s.label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* fret numbers */}
        {windowFrets.map((fret, i) => (
          <SvgText
            key={fret}
            x={l.xForFretSlot(i)} y={14}
            fontSize={10} fill="rgba(0,0,0,0.4)"
            textAnchor="middle"
          >
            {fret === 0 ? 'O' : fret}
          </SvgText>
        ))}

        {/* highlighted dots */}
        {highlightedPositions?.map(({ pos, color }) => {
          const row = displayRowForString(pos.string);
          const slotIdx = windowFrets.indexOf(pos.fret);
          if (row < 0 || slotIdx < 0) return null;
          const cx = l.xForFretSlot(slotIdx);
          const cy = l.yForDisplayRow(row);
          const r = Math.min(l.cellW, l.cellH) * 0.35;
          return (
            <React.Fragment key={`hl-${pos.string.index}-${pos.fret}`}>
              <Circle cx={cx} cy={cy} r={r} fill={color} />
              <Circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2} />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Pressable overlay — one per cell, avoids SVG responder issues on web */}
      {onPositionTap && displayStrings.map((s, row) =>
        windowFrets.map((fret, slotIdx) => {
          const x = LEFT_INSET + slotIdx * l.cellW;
          const y = l.yForDisplayRow(row) - l.cellH / 2;
          const h = row === 0 ? l.cellH / 2 + TOP_INSET : l.cellH;
          return (
            <Pressable
              key={`tap-${s.index}-${fret}`}
              style={[styles.tapTarget, { left: x, top: Math.max(0, y), width: l.cellW, height: h }]}
              onPress={() => onPositionTap({ string: s, fret })}
            />
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } as object,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  tapTarget: {
    position: 'absolute',
  },
});
