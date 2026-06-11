import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, useWindowDimensions,
  Pressable, SafeAreaView, Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSpeedGame } from '@/store/useSpeedGame';
import {
  DIFFICULTIES, DIFFICULTY_CONFIGS, SpeedDifficulty, rollingAverage,
} from '@/domain/speedGame';
import FretboardView from '@/components/FretboardView';
import AnswerGrid from '@/components/AnswerGrid';
import { StatChip, ChipRow } from '@/components/StatsChips';
import ResponseTimeChart, { lineColorForAverage } from '@/components/ResponseTimeChart';

function Stepper({
  label, value, unit = 's', step = 1, min = 0, max = 120,
  onChange,
}: {
  label: string; value: number; unit?: string; step?: number;
  min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <View style={stepperStyles.row}>
      <Text style={stepperStyles.label}>{label}</Text>
      <View style={stepperStyles.control}>
        <Pressable
          style={[stepperStyles.btn, value <= min && stepperStyles.btnDisabled]}
          onPress={() => { if (value > min) onChange(value - step); }}
          hitSlop={8}
        >
          <Text style={stepperStyles.btnText}>−</Text>
        </Pressable>
        <Text style={stepperStyles.value}>{value}{unit}</Text>
        <Pressable
          style={[stepperStyles.btn, value >= max && stepperStyles.btnDisabled]}
          onPress={() => { if (value < max) onChange(value + step); }}
          hitSlop={8}
        >
          <Text style={stepperStyles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 15, color: '#1C1C1E' },
  control: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  btn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.3 },
  btnText: { fontSize: 20, color: '#007AFF', lineHeight: 24 },
  value: { width: 44, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
});

const FRETBOARD_HEIGHT = 200;
const WRONG_FLASH_MS = 600;

export default function SpeedGameScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = width - 32;

  const {
    status, difficulty, activeThreshold, activePenalty,
    prompt, choices, wrongFlash, score, times,
    bestScore, isNewBest,
    init, setDifficulty, updateThreshold, updatePenalty, start, answer, clearWrongFlash,
  } = useSpeedGame();

  const threshold = activeThreshold;

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!wrongFlash) return;
    const t = setTimeout(clearWrongFlash, WRONG_FLASH_MS);
    return () => clearTimeout(t);
  }, [wrongFlash]);

  const avg = rollingAverage(times);

  if (status === 'idle') {
    return (
      <>
        <Stack.Screen options={{ title: 'Speed Game', headerBackTitle: 'Back' }} />
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, styles.idleCard]}>
              <Text style={styles.idleTitle}>Speed Game</Text>
              <Text style={styles.idleSubtitle}>
                Keep your rolling average below the time limit.{'\n'}
                Wrong answers add penalty seconds.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Difficulty</Text>
              <View style={styles.difficultyRow}>
                {DIFFICULTIES.map((d: SpeedDifficulty) => {
                  const cfg = DIFFICULTY_CONFIGS[d];
                  const selected = d === difficulty;
                  return (
                    <Pressable
                      key={d}
                      style={[styles.difficultyBtn, selected && styles.difficultyBtnSelected]}
                      onPress={() => setDifficulty(d)}
                    >
                      <Text style={[styles.difficultyBtnLabel, selected && styles.difficultyBtnLabelSelected]}>
                        {cfg.label}
                      </Text>
                      <Text style={[styles.difficultyBtnDetail, selected && styles.difficultyBtnDetailSelected]}>
                        {cfg.threshold}s / +{cfg.wrongPenalty}s
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Tune the numbers</Text>
              <Stepper
                label="Time limit"
                value={activeThreshold}
                min={1}
                max={120}
                onChange={updateThreshold}
              />
              <View style={styles.divider} />
              <Stepper
                label="Wrong-tap penalty"
                value={activePenalty}
                min={0}
                max={30}
                onChange={updatePenalty}
              />
            </View>

            {bestScore > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Personal best — {DIFFICULTY_CONFIGS[difficulty].label}</Text>
                <Text style={styles.idleBestScore}>{bestScore}</Text>
              </View>
            )}

            <Pressable style={styles.primaryButton} onPress={() => start()}>
              <Text style={styles.primaryButtonText}>Start</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  if (status === 'gameOver') {
    return (
      <>
        <Stack.Screen options={{ title: 'Speed Game', headerBackTitle: 'Back' }} />
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.card, styles.gameOverCard]}>
              <Text style={styles.gameOverTitle}>Game Over</Text>
              <Text style={styles.gameOverReason}>
                Average response time exceeded {threshold}s
              </Text>
              <Text style={styles.finalScore}>{score}</Text>
              <Text style={styles.finalScoreLabel}>
                {score === 1 ? 'note identified' : 'notes identified'}
              </Text>
              {isNewBest ? (
                <View style={styles.newBestBadge}>
                  <Text style={styles.newBestText}>★ New personal best</Text>
                </View>
              ) : (
                <Text style={styles.bestText}>Personal best: {bestScore}</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.chartTitle}>This run</Text>
              <ResponseTimeChart times={times} width={contentWidth - 32} threshold={threshold} />
            </View>

            <Pressable style={styles.primaryButton} onPress={() => start()}>
              <Text style={styles.primaryButtonText}>Play Again</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => router.dismissAll()}>
              <Text style={styles.secondaryButtonText}>Home</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  if (!prompt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stringLabel = prompt.position.string.label.toUpperCase();
  const fretLabel = prompt.position.fret === 0
    ? 'Open string'
    : `Fret ${prompt.position.fret}`;

  return (
    <>
      <Stack.Screen options={{ title: 'Speed Game', headerBackTitle: 'Back' }} />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ChipRow>
            <StatChip label="Score" value={score} />
            <StatChip label="Best" value={bestScore} />
            <StatChip
              label={`Avg (${threshold}s limit)`}
              value={avg === null ? '—' : `${avg.toFixed(1)}s`}
              valueColor={avg === null ? undefined : lineColorForAverage(avg, threshold)}
            />
          </ChipRow>

          <View style={styles.card}>
            <Text style={styles.promptInstruction}>What note is this?</Text>
            <Text style={styles.promptPosition}>{stringLabel} string · {fretLabel}</Text>
          </View>

          <FretboardView
            prompt={prompt}
            width={contentWidth}
            height={FRETBOARD_HEIGHT}
          />

          <View style={styles.card}>
            <ResponseTimeChart times={times} width={contentWidth - 32} threshold={threshold} />
          </View>

          <AnswerGrid
            choices={choices}
            feedback={wrongFlash ? { answer: wrongFlash, isCorrect: false } : null}
            onSelect={answer}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#8E8E93', fontSize: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as object,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  promptInstruction: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  promptPosition: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  chartTitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },

  // Idle screen
  idleCard: { alignItems: 'center', paddingVertical: 24 },
  idleTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  idleSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 10 },
  difficultyRow: { flexDirection: 'row', gap: 8 },
  difficultyBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  difficultyBtnSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF0D',
  },
  difficultyBtnLabel: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  difficultyBtnLabelSelected: { color: '#007AFF' },
  difficultyBtnDetail: { fontSize: 11, color: '#8E8E93' },
  difficultyBtnDetailSelected: { color: '#007AFF' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA', marginVertical: 4 },
  idleBestScore: { fontSize: 40, fontWeight: '800', color: '#007AFF', textAlign: 'center' },

  // Game over
  gameOverCard: { alignItems: 'center', paddingVertical: 28 },
  gameOverTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  gameOverReason: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  finalScore: { fontSize: 56, fontWeight: '800', color: '#007AFF', marginTop: 12 },
  finalScoreLabel: { fontSize: 14, color: '#8E8E93', marginBottom: 12 },
  newBestBadge: {
    backgroundColor: '#FF950022',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  newBestText: { fontSize: 14, fontWeight: '700', color: '#FF9500' },
  bestText: { fontSize: 14, color: '#8E8E93' },

  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  secondaryButtonText: { color: '#007AFF', fontSize: 17, fontWeight: '600' },
});
