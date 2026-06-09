import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, Rect } from 'react-native-svg';
import { IntervalRun } from '@/domain/cagedShapes';
import { GUITAR_STRINGS } from '@/domain/guitarString';

// ─── Layout constants ────────────────────────────────────────────────────────

const LABEL_W = 18;     // left column for string labels
const PAD_R = 8;
const FRET_W = 30;
const UPPER_Y = 26;     // higher-pitched string drawn on top
const STR_GAP = 38;
const LOWER_Y = UPPER_Y + STR_GAP;
const FRET_NUM_Y = LOWER_Y + 24;
const H = FRET_NUM_Y + 10;
const DOT_R = 9;

const FRET_MARKERS = [3, 5, 7, 9, 12, 15];

// Column 0 holds open-string notes; the nut sits between columns 0 and 1.
function colX(fret: number): number {
  return LABEL_W + (fret + 0.5) * FRET_W;
}

interface Props {
  run: IntervalRun;
  color: string;
}

export default function IntervalRunView({ run, color }: Props) {
  const maxFret = Math.max(
    ...run.steps.flatMap(s => [s.lowerFret, s.upperFret]),
  );
  const nCols = maxFret + 2; // open column + frets, plus a trailing space
  const W = LABEL_W + nCols * FRET_W + PAD_R;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <Svg width={W} height={H}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#F9F9F9" />

        {/* String labels */}
        <SvgText
          x={LABEL_W / 2} y={UPPER_Y + 4}
          fontSize={10} fontWeight="500"
          fill="rgba(0,0,0,0.4)" textAnchor="middle"
        >
          {GUITAR_STRINGS[run.upperString].label}
        </SvgText>
        <SvgText
          x={LABEL_W / 2} y={LOWER_Y + 4}
          fontSize={10} fontWeight="500"
          fill="rgba(0,0,0,0.4)" textAnchor="middle"
        >
          {GUITAR_STRINGS[run.lowerString].label}
        </SvgText>

        {/* String lines */}
        {[UPPER_Y, LOWER_Y].map(y => (
          <Line
            key={y}
            x1={LABEL_W} y1={y}
            x2={W - PAD_R} y2={y}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={1.5}
          />
        ))}

        {/* Fret lines — the line after column 0 is the nut */}
        {Array.from({ length: nCols }, (_, i) => i + 1).map(i => (
          <Line
            key={i}
            x1={LABEL_W + i * FRET_W} y1={UPPER_Y - 6}
            x2={LABEL_W + i * FRET_W} y2={LOWER_Y + 6}
            stroke={i === 1 ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.08)'}
            strokeWidth={i === 1 ? 2.5 : 1}
          />
        ))}

        {/* Fret number markers */}
        {FRET_MARKERS.filter(f => f <= maxFret).map(f => (
          <SvgText
            key={f}
            x={colX(f)} y={FRET_NUM_Y}
            fontSize={9} fontWeight="600"
            fill="rgba(0,0,0,0.3)" textAnchor="middle"
          >
            {f}
          </SvgText>
        ))}

        {/* Interval pairs */}
        {run.steps.map((step, i) => {
          const lx = colX(step.lowerFret);
          const ux = colX(step.upperFret);
          const isMajor = step.quality.startsWith('M');
          const lowerIsRoot = step.lowerDegree === 'R';
          const upperIsRoot = step.upperDegree === 'R';

          return (
            <React.Fragment key={i}>
              {/* Connector */}
              <Line
                x1={ux} y1={UPPER_Y}
                x2={lx} y2={LOWER_Y}
                stroke={color + '50'}
                strokeWidth={1.5}
              />

              {/* Quality label above the pair */}
              <SvgText
                x={(lx + ux) / 2} y={UPPER_Y - DOT_R - 4}
                fontSize={8} fontWeight="600"
                fill={isMajor ? color : 'rgba(0,0,0,0.35)'}
                textAnchor="middle"
              >
                {step.quality}
              </SvgText>

              {/* Upper (harmony) dot */}
              <Circle cx={ux} cy={UPPER_Y} r={DOT_R} fill={upperIsRoot ? color : color + '28'} />
              <SvgText
                x={ux} y={UPPER_Y + 3.4}
                fontSize={step.upperDegree.length > 1 ? 8 : 9} fontWeight="700"
                fill={upperIsRoot ? '#fff' : color} textAnchor="middle"
              >
                {step.upperDegree}
              </SvgText>

              {/* Lower (melody) dot */}
              <Circle cx={lx} cy={LOWER_Y} r={DOT_R} fill={lowerIsRoot ? color : color + '28'} />
              <SvgText
                x={lx} y={LOWER_Y + 3.4}
                fontSize={step.lowerDegree.length > 1 ? 8 : 9} fontWeight="700"
                fill={lowerIsRoot ? '#fff' : color} textAnchor="middle"
              >
                {step.lowerDegree}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: 2 },
});
