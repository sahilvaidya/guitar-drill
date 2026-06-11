// Offline plucked-string synthesis (Karplus-Strong) rendered to 16-bit PCM WAV.
// Pure TS so the audio pipeline is unit-testable; playback lives in earAudio.ts.

import { EarIntervalPrompt, secondMidi } from '@/domain/earInterval';

export const SAMPLE_RATE = 22050;
export const TONE_SECONDS = 1.1;
export const MELODIC_GAP_SECONDS = 0.15;
/**
 * Silence rendered before the first note. iOS swallows the first fraction of
 * a second of output while the audio hardware spins up from idle, so audio
 * starting at sample zero gets its attack clipped on a cold start.
 */
export const LEAD_IN_SECONDS = 0.3;

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Deterministic LCG so synthesized tones are reproducible across runs. */
function makeLcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/**
 * Karplus-Strong plucked string: a noise burst circulates through a delay
 * line with a two-point averaging lowpass, decaying into a guitar-like tone.
 */
export function pluck(
  frequency: number,
  seconds: number = TONE_SECONDS,
  sampleRate: number = SAMPLE_RATE,
): Float32Array {
  const period = Math.max(2, Math.round(sampleRate / frequency));
  const totalSamples = Math.round(seconds * sampleRate);
  const rand = makeLcg(period * 7919);

  const delayLine = new Float32Array(period);
  for (let i = 0; i < period; i++) delayLine[i] = rand() * 2 - 1;

  const out = new Float32Array(totalSamples);
  let ptr = 0;
  for (let i = 0; i < totalSamples; i++) {
    out[i] = delayLine[ptr];
    const next = (ptr + 1) % period;
    delayLine[ptr] = 0.5 * (delayLine[ptr] + delayLine[next]) * 0.996;
    ptr = next;
  }

  // Short attack ramp and release fade to avoid clicks at the edges.
  const attack = Math.min(Math.round(0.003 * sampleRate), totalSamples);
  for (let i = 0; i < attack; i++) out[i] *= i / attack;
  const release = Math.min(Math.round(0.05 * sampleRate), totalSamples);
  for (let i = 0; i < release; i++) {
    out[totalSamples - 1 - i] *= i / release;
  }

  // Normalize to a consistent peak.
  let peak = 0;
  for (let i = 0; i < totalSamples; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0) {
    const gain = 0.75 / peak;
    for (let i = 0; i < totalSamples; i++) out[i] *= gain;
  }
  return out;
}

/**
 * Renders the full audio for an interval prompt: two sequential plucks for
 * melodic (ascending/descending) prompts, two simultaneous plucks for harmonic.
 */
export function renderIntervalTone(prompt: EarIntervalPrompt): Float32Array {
  const first = pluck(midiToFrequency(prompt.rootMidi));
  const second = pluck(midiToFrequency(secondMidi(prompt)));
  const leadIn = Math.round(LEAD_IN_SECONDS * SAMPLE_RATE);

  if (prompt.direction === 'harmonic') {
    const out = new Float32Array(leadIn + first.length);
    for (let i = 0; i < first.length; i++) out[leadIn + i] = 0.6 * (first[i] + second[i]);
    return out;
  }

  const gap = Math.round(MELODIC_GAP_SECONDS * SAMPLE_RATE);
  const out = new Float32Array(leadIn + first.length + gap + second.length);
  out.set(first, leadIn);
  out.set(second, leadIn + first.length + gap);
  return out;
}

/** Encodes mono float samples as a 16-bit PCM WAV byte buffer. */
export function encodeWavPcm16(
  samples: Float32Array,
  sampleRate: number = SAMPLE_RATE,
): Uint8Array {
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);            // fmt chunk size
  view.setUint16(20, 1, true);             // PCM
  view.setUint16(22, 1, true);             // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);             // block align
  view.setUint16(34, 16, true);            // bits per sample
  writeAscii(36, 'data');
  view.setUint32(40, dataLength, true);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, Math.round(clamped * 0x7fff), true);
  }
  return new Uint8Array(buffer);
}

export function renderIntervalWav(prompt: EarIntervalPrompt): Uint8Array {
  return encodeWavPcm16(renderIntervalTone(prompt));
}

/** Renders the audio for a single-note prompt: LEAD_IN_SECONDS of silence + one pluck. */
export function renderNoteTone(midi: number): Float32Array {
  const tone = pluck(midiToFrequency(midi));
  const leadIn = Math.round(LEAD_IN_SECONDS * SAMPLE_RATE);
  const out = new Float32Array(leadIn + tone.length);
  out.set(tone, leadIn);
  return out;
}

export function renderNoteWav(midi: number): Uint8Array {
  return encodeWavPcm16(renderNoteTone(midi));
}

/**
 * One second of a sub-audible keep-alive signal. Speaker and Bluetooth
 * amplifiers power-gate on digital silence and swallow the attack of the
 * next sound while waking, so the keep-alive loop must carry a real signal:
 * a 45 Hz sine at -48 dB is below what phone speakers can reproduce and far
 * below audibility, but keeps the output stage awake. 45 Hz divides the
 * sample rate evenly, so the loop point is phase-continuous (no click).
 */
export function keepAliveTone(sampleRate: number = SAMPLE_RATE): Float32Array {
  const out = new Float32Array(sampleRate);
  const freq = 45;
  const amplitude = 0.004;
  for (let i = 0; i < out.length; i++) {
    out[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return out;
}
