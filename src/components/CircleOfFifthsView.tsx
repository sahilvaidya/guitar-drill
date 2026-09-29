import React from 'react';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { CIRCLE_OF_FIFTHS, CircleKey } from '@/domain/musicTheory';

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 118;
const R_INNER = 78;
const NODE_OUTER = 22;
const NODE_INNER = 17;

function pointAt(position: number, radius: number): { x: number; y: number } {
  const angle = (position * 30 - 90) * (Math.PI / 180);
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
}

const display = (name: string) => name.replace('#', '♯').replace(/b$/, '♭');

interface Props {
  selected: number;
  onSelect: (position: number) => void;
  color: string;
}

export default function CircleOfFifthsView({ selected, onSelect, color }: Props) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <Circle cx={CX} cy={CY} r={R_OUTER + NODE_OUTER + 4} fill="none" stroke="#E5E5EA" />
      {CIRCLE_OF_FIFTHS.map((key: CircleKey) => {
        const isSel = key.position === selected;
        const o = pointAt(key.position, R_OUTER);
        const i = pointAt(key.position, R_INNER);
        const majorLabel = key.position === 6 ? 'F♯' : display(key.major);
        return (
          <G key={key.position} onPress={() => onSelect(key.position)}>
            <Circle
              cx={o.x} cy={o.y} r={NODE_OUTER}
              fill={isSel ? color : '#fff'} stroke={color} strokeWidth={1.5}
            />
            <SvgText
              x={o.x} y={o.y + 5} fontSize={15} fontWeight="700"
              textAnchor="middle" fill={isSel ? '#fff' : '#1C1C1E'}
            >
              {majorLabel}
            </SvgText>
            <Circle
              cx={i.x} cy={i.y} r={NODE_INNER}
              fill={isSel ? color + '33' : '#F2F2F7'}
            />
            <SvgText
              x={i.x} y={i.y + 4} fontSize={11} fontWeight="600"
              textAnchor="middle" fill="#8E8E93"
            >
              {display(key.minor)}m
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
