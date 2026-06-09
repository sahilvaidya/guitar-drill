import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { CagedBox, KeyMode, degreeLabel, pitchClassAt } from '@/domain/cagedShapes';
import { GUITAR_STRINGS } from '@/domain/guitarString';

// ─── Layout constants ────────────────────────────────────────────────────────

const LABEL_W = 18;     // left column for string labels (e B G D A E)
const PAD_R = 6;
const PAD_T = 12;
const PAD_B = 22;       // room for the base-fret label
const N_FRET_SPACES = 5;
const N_STRINGS = 6;
const FRET_W = 38;
const STR_GAP = 25;
const DOT_R = 10;

const W = LABEL_W + N_FRET_SPACES * FRET_W + PAD_R;
const H = PAD_T + (N_STRINGS - 1) * STR_GAP + PAD_B;
const boardH = (N_STRINGS - 1) * STR_GAP;

// Display order top→bottom = high e → low E, so displayIndex = 5 - stringIndex
function stringY(stringIndex: number): number {
  return PAD_T + (N_STRINGS - 1 - stringIndex) * STR_GAP;
}

function dotX(offset: number): number {
  return LABEL_W + (offset + 0.5) * FRET_W;
}

interface Props {
  box: CagedBox;
  mode: KeyMode;
  color: string;
}

export default function ScaleBoxDiagramView({ box, mode, color }: Props) {
  return (
    <View style={styles.wrapper}>
      <Svg width={W} height={H}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#F9F9F9" />

        {/* String labels */}
        {GUITAR_STRINGS.map(s => (
          <SvgText
            key={s.index}
            x={LABEL_W / 2}
            y={stringY(s.index) + 4}
            fontSize={10}
            fontWeight="500"
            fill="rgba(0,0,0,0.4)"
            textAnchor="middle"
          >
            {s.label}
          </SvgText>
        ))}

        {/* String lines */}
        {GUITAR_STRINGS.map(s => (
          <Line
            key={s.index}
            x1={LABEL_W} y1={stringY(s.index)}
            x2={W - PAD_R} y2={stringY(s.index)}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={1.5}
          />
        ))}

        {/* Fret lines */}
        {Array.from({ length: N_FRET_SPACES + 1 }, (_, i) => {
          const x = LABEL_W + i * FRET_W;
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

        {/* Base fret label under the first fret space */}
        <SvgText
          x={dotX(0)}
          y={H - 6}
          fontSize={10}
          fontWeight="600"
          fill="rgba(0,0,0,0.35)"
          textAnchor="middle"
        >
          {`${box.baseFret}fr`}
        </SvgText>

        {/* Dots */}
        {box.frets.flatMap((offsets, si) =>
          offsets.map(offset => {
            const pc = pitchClassAt(si, box.baseFret + offset);
            const label = degreeLabel(pc, mode) ?? '?';
            const isRoot = label === 'R';
            const cx = dotX(offset);
            const cy = stringY(si);
            const fontSize = label.length > 1 ? 8 : 10;

            return (
              <React.Fragment key={`${si}-${offset}`}>
                <Circle cx={cx} cy={cy} r={DOT_R} fill={isRoot ? color : color + '28'} />
                {isRoot && (
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
                  fill={isRoot ? '#fff' : color}
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
});
