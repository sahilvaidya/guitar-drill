import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { QuizPrompt } from '@/domain/quizPrompt';
import { FretPosition } from '@/domain/fretPosition';
import { GUITAR_STRINGS } from '@/domain/guitarString';

interface HighlightedPosition {
  pos: FretPosition;
  color: string;
}

interface Props {
  prompt?: QuizPrompt;
  width: number;
  height: number;
  onPositionTap?: (pos: FretPosition) => void;
  highlightedPositions?: HighlightedPosition[];
}

const MARKER_FRETS = [3, 5, 7, 9];
const FRET_COUNT = 12;
const LEFT_INSET = 52;
const RIGHT_INSET = 18;
const TOP_INSET = 28;
const BOTTOM_INSET = 24;

function layout(width: number, height: number) {
  const innerW = width - LEFT_INSET - RIGHT_INSET;
  const innerH = height - TOP_INSET - BOTTOM_INSET;
  const fretSpacing = innerW / FRET_COUNT;
  const stringSpacing = innerH / (GUITAR_STRINGS.length - 1);
  const rightEdge = width - RIGHT_INSET;
  const bottomEdge = height - BOTTOM_INSET;

  function xForFret(fret: number): number {
    if (fret === 0) return LEFT_INSET;
    return LEFT_INSET + (fret - 0.5) * fretSpacing;
  }

  function yForString(index: number): number {
    return TOP_INSET + (GUITAR_STRINGS.length - 1 - index) * stringSpacing;
  }

  return { fretSpacing, stringSpacing, rightEdge, bottomEdge, xForFret, yForString };
}

export default function FretboardView({
  prompt,
  width,
  height,
  onPositionTap,
  highlightedPositions,
}: Props) {
  const l = layout(width, height);
  const markerY = TOP_INSET + (l.bottomEdge - TOP_INSET) / 2;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* background */}
        <Rect x={0} y={0} width={width} height={height} rx={16} fill="#fff" />

        {/* strings */}
        {GUITAR_STRINGS.map(s => {
          const y = l.yForString(s.index);
          return (
            <React.Fragment key={s.name}>
              <Line
                x1={LEFT_INSET} y1={y}
                x2={l.rightEdge} y2={y}
                stroke="rgba(0,0,0,0.18)" strokeWidth={2}
              />
              <SvgText
                x={24} y={y + 4}
                fontSize={11} fontWeight="600"
                fill="rgba(0,0,0,0.45)"
                textAnchor="middle"
              >
                {s.label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* fret lines */}
        {Array.from({ length: FRET_COUNT + 1 }, (_, i) => {
          const x = LEFT_INSET + i * l.fretSpacing;
          const isNut = i === 0;
          return (
            <Line
              key={i}
              x1={x} y1={TOP_INSET - 4}
              x2={x} y2={l.bottomEdge + 4}
              stroke={isNut ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.14)'}
              strokeWidth={isNut ? 4 : 1}
            />
          );
        })}

        {/* fret numbers */}
        {Array.from({ length: FRET_COUNT }, (_, i) => {
          const fret = i + 1;
          return (
            <SvgText
              key={fret}
              x={l.xForFret(fret)} y={12}
              fontSize={9} fill="rgba(0,0,0,0.4)"
              textAnchor="middle"
            >
              {fret}
            </SvgText>
          );
        })}

        {/* marker dots */}
        {MARKER_FRETS.map(fret => (
          <Circle
            key={fret}
            cx={l.xForFret(fret)} cy={markerY}
            r={5} fill="rgba(0,0,0,0.2)"
          />
        ))}

        {/* prompt dot (forward drill) */}
        {prompt && (
          <>
            <Circle
              cx={l.xForFret(prompt.position.fret)}
              cy={l.yForString(prompt.position.string.index)}
              r={12}
              fill="#007AFF"
            />
            <Circle
              cx={l.xForFret(prompt.position.fret)}
              cy={l.yForString(prompt.position.string.index)}
              r={12}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
            />
          </>
        )}

        {/* highlighted positions (inverse drill reveal / wrong-tap flash) */}
        {highlightedPositions?.map(({ pos, color }) => (
          <React.Fragment key={`hl-${pos.string.index}-${pos.fret}`}>
            <Circle
              cx={l.xForFret(pos.fret)}
              cy={l.yForString(pos.string.index)}
              r={12}
              fill={color}
            />
            <Circle
              cx={l.xForFret(pos.fret)}
              cy={l.yForString(pos.string.index)}
              r={12}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
            />
          </React.Fragment>
        ))}

        {/* tap hit targets (inverse drill) */}
        {onPositionTap && GUITAR_STRINGS.map(string =>
          Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
            const x = fret === 0
              ? 0
              : LEFT_INSET + (fret - 1) * l.fretSpacing;
            const w = fret === 0 ? LEFT_INSET : l.fretSpacing;
            const y = l.yForString(string.index) - l.stringSpacing / 2;
            return (
              <Rect
                key={`tap-${string.index}-${fret}`}
                x={x} y={y}
                width={w} height={l.stringSpacing}
                fill="transparent"
                onPress={() => onPositionTap({ string, fret })}
              />
            );
          })
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
