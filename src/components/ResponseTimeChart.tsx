import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { THRESHOLD_SECONDS, rollingAverage } from '@/domain/speedGame';

const GREEN = '#34C759';
const AMBER = '#FF9500';
const RED = '#FF3B30';

const PAD_L = 26;   // room for y-axis labels
const PAD_R = 8;
const PAD_T = 8;
const PAD_B = 16;   // room for x-axis labels
const MAX_VISIBLE_POINTS = 20;

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${c(ar, br)},${c(ag, bg)},${c(ab, bb)})`;
}

/** Green when comfortably fast, shifting through amber to red near the threshold. */
export function lineColorForAverage(avg: number | null, threshold = THRESHOLD_SECONDS): string {
  if (avg === null) return GREEN;
  const t = Math.min(Math.max(avg / threshold, 0), 1);
  return t < 0.6 ? lerpColor(GREEN, AMBER, t / 0.6) : lerpColor(AMBER, RED, (t - 0.6) / 0.4);
}

interface Props {
  /** Response time in seconds per prompt, oldest first. */
  times: number[];
  width: number;
  height?: number;
  /** The game-over threshold for this run. Defaults to the normal-difficulty threshold. */
  threshold?: number;
}

export default function ResponseTimeChart({ times, width, height = 120, threshold = THRESHOLD_SECONDS }: Props) {
  const plotW = width - PAD_L - PAD_R;
  const plotH = height - PAD_T - PAD_B;

  if (times.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Answer prompts to chart your response times</Text>
      </View>
    );
  }

  const visible = times.slice(-MAX_VISIBLE_POINTS);
  const firstPromptNumber = times.length - visible.length + 1;
  const yMax = Math.max(threshold * 1.6, ...visible) + 0.5;
  const color = lineColorForAverage(rollingAverage(times), threshold);

  const xFor = (i: number) =>
    visible.length === 1 ? PAD_L + plotW / 2 : PAD_L + (i / (visible.length - 1)) * plotW;
  const yFor = (v: number) => PAD_T + (1 - v / yMax) * plotH;

  const points = visible.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
  const thresholdY = yFor(threshold);

  return (
    <Svg width={width} height={height}>
      {/* Axes */}
      <Line
        x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + plotH}
        stroke="rgba(0,0,0,0.12)" strokeWidth={1}
      />
      <Line
        x1={PAD_L} y1={PAD_T + plotH} x2={width - PAD_R} y2={PAD_T + plotH}
        stroke="rgba(0,0,0,0.12)" strokeWidth={1}
      />
      <SvgText
        x={PAD_L - 5} y={PAD_T + plotH + 3}
        fontSize={9} fill="rgba(0,0,0,0.35)" textAnchor="end"
      >
        0s
      </SvgText>

      {/* Danger line at the threshold */}
      <Line
        x1={PAD_L} y1={thresholdY} x2={width - PAD_R} y2={thresholdY}
        stroke={RED} strokeWidth={1.5} strokeDasharray="5,4" opacity={0.7}
      />
      <SvgText
        x={PAD_L - 5} y={thresholdY + 3}
        fontSize={9} fontWeight="600" fill={RED} textAnchor="end"
      >
        {threshold}s
      </SvgText>

      {/* Response time line */}
      {visible.length > 1 && (
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
      )}
      {visible.map((v, i) => (
        <Circle
          key={i}
          cx={xFor(i)} cy={yFor(v)}
          r={i === visible.length - 1 ? 4 : 2.5}
          fill={v > threshold ? RED : color}
        />
      ))}

      {/* Prompt numbers at the ends of the visible window */}
      <SvgText
        x={xFor(0)} y={height - 4}
        fontSize={9} fill="rgba(0,0,0,0.35)" textAnchor="middle"
      >
        {firstPromptNumber}
      </SvgText>
      {visible.length > 1 && (
        <SvgText
          x={xFor(visible.length - 1)} y={height - 4}
          fontSize={9} fill="rgba(0,0,0,0.35)" textAnchor="middle"
        >
          {times.length}
        </SvgText>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, color: '#AEAEB2', textAlign: 'center', paddingHorizontal: 20 },
});
