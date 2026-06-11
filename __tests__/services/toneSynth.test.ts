import {
  SAMPLE_RATE,
  TONE_SECONDS,
  MELODIC_GAP_SECONDS,
  LEAD_IN_SECONDS,
  midiToFrequency,
  pluck,
  renderIntervalTone,
  encodeWavPcm16,
  renderIntervalWav,
  keepAliveTone,
} from '@/services/toneSynth';
import { EarIntervalPrompt } from '@/domain/earInterval';

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint32(offset, true);
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint16(offset, true);
}

function rms(samples: Float32Array, start: number, end: number): number {
  let sum = 0;
  for (let i = start; i < end; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / (end - start));
}

describe('midiToFrequency', () => {
  it('maps A4 (69) to 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440);
  });

  it('maps low E (40) to ~82.41 Hz', () => {
    expect(midiToFrequency(40)).toBeCloseTo(82.41, 1);
  });

  it('doubles every octave', () => {
    expect(midiToFrequency(81)).toBeCloseTo(2 * midiToFrequency(69));
  });
});

describe('pluck', () => {
  it('produces the requested number of samples', () => {
    const tone = pluck(440, 0.5, SAMPLE_RATE);
    expect(tone.length).toBe(Math.round(0.5 * SAMPLE_RATE));
  });

  it('is normalized: audible but never above the target peak', () => {
    const tone = pluck(220);
    let peak = 0;
    for (const s of tone) peak = Math.max(peak, Math.abs(s));
    expect(peak).toBeGreaterThan(0.5);
    expect(peak).toBeLessThanOrEqual(0.7501);
  });

  it('starts and ends silent (no clicks)', () => {
    const tone = pluck(330);
    expect(Math.abs(tone[0])).toBeLessThan(0.01);
    expect(Math.abs(tone[tone.length - 1])).toBeLessThan(0.01);
  });

  it('oscillates at the requested fundamental (periodic at the delay length)', () => {
    const freq = 220;
    const tone = pluck(freq, 1.0);
    const period = Math.round(SAMPLE_RATE / freq);
    // After the noisy attack the Karplus-Strong output repeats every period.
    const start = Math.round(0.3 * SAMPLE_RATE);
    const len = period * 20;
    let dot = 0, energyA = 0, energyB = 0;
    for (let i = start; i < start + len; i++) {
      dot += tone[i] * tone[i + period];
      energyA += tone[i] * tone[i];
      energyB += tone[i + period] * tone[i + period];
    }
    const correlation = dot / Math.sqrt(energyA * energyB);
    expect(correlation).toBeGreaterThan(0.95);
  });

  it('is deterministic for the same frequency', () => {
    expect(pluck(440)).toEqual(pluck(440));
  });
});

describe('renderIntervalTone', () => {
  const melodic: EarIntervalPrompt = { interval: 'P5', direction: 'ascending', rootMidi: 52 };
  const harmonic: EarIntervalPrompt = { interval: 'M3', direction: 'harmonic', rootMidi: 52 };

  const leadLen = Math.round(LEAD_IN_SECONDS * SAMPLE_RATE);

  it('melodic prompts contain two sequential tones separated by a gap', () => {
    const audio = renderIntervalTone(melodic);
    const toneLen = Math.round(TONE_SECONDS * SAMPLE_RATE);
    const gapLen = Math.round(MELODIC_GAP_SECONDS * SAMPLE_RATE);
    expect(audio.length).toBe(leadLen + 2 * toneLen + gapLen);
    // energy in both note segments, near-silence in the gap
    expect(rms(audio, leadLen, leadLen + toneLen)).toBeGreaterThan(0.05);
    expect(rms(audio, leadLen + toneLen + gapLen, audio.length)).toBeGreaterThan(0.05);
    expect(rms(audio, leadLen + toneLen, leadLen + toneLen + gapLen)).toBeLessThan(0.001);
  });

  it('harmonic prompts play both notes simultaneously in a single tone length', () => {
    const audio = renderIntervalTone(harmonic);
    expect(audio.length).toBe(leadLen + Math.round(TONE_SECONDS * SAMPLE_RATE));
    let peak = 0;
    for (const s of audio) peak = Math.max(peak, Math.abs(s));
    expect(peak).toBeGreaterThan(0.3);
    expect(peak).toBeLessThanOrEqual(1);
  });

  it('starts with lead-in silence so a cold audio session cannot clip the attack', () => {
    for (const prompt of [melodic, harmonic]) {
      const audio = renderIntervalTone(prompt);
      expect(rms(audio, 0, leadLen)).toBe(0);
    }
  });
});

describe('encodeWavPcm16', () => {
  it('writes a valid 16-bit mono PCM WAV header', () => {
    const samples = new Float32Array(1000);
    const wav = encodeWavPcm16(samples, SAMPLE_RATE);

    expect(ascii(wav, 0, 4)).toBe('RIFF');
    expect(ascii(wav, 8, 4)).toBe('WAVE');
    expect(ascii(wav, 12, 4)).toBe('fmt ');
    expect(ascii(wav, 36, 4)).toBe('data');

    expect(wav.length).toBe(44 + samples.length * 2);
    expect(readUint32LE(wav, 4)).toBe(36 + samples.length * 2);
    expect(readUint16LE(wav, 20)).toBe(1);            // PCM
    expect(readUint16LE(wav, 22)).toBe(1);            // mono
    expect(readUint32LE(wav, 24)).toBe(SAMPLE_RATE);
    expect(readUint16LE(wav, 34)).toBe(16);           // bit depth
    expect(readUint32LE(wav, 40)).toBe(samples.length * 2);
  });

  it('clamps out-of-range samples instead of wrapping', () => {
    const wav = encodeWavPcm16(new Float32Array([2, -2]), SAMPLE_RATE);
    const view = new DataView(wav.buffer);
    expect(view.getInt16(44, true)).toBe(0x7fff);
    expect(view.getInt16(46, true)).toBe(-0x7fff);
  });
});

describe('keepAliveTone', () => {
  it('is non-silent but far below audibility', () => {
    const tone = keepAliveTone();
    let peak = 0;
    for (const s of tone) peak = Math.max(peak, Math.abs(s));
    expect(peak).toBeGreaterThan(0.001); // real signal, not digital silence
    expect(peak).toBeLessThan(0.01);     // ≈ -48 dB, inaudible
  });

  it('loops without a phase discontinuity', () => {
    const tone = keepAliveTone();
    expect(tone.length).toBe(SAMPLE_RATE); // 1s loop
    // 45 Hz divides 22050 evenly, so wrapping from the last sample back to
    // the first continues the sine exactly one sample apart.
    expect(tone[0]).toBeCloseTo(0, 6);
    expect(tone[tone.length - 1]).toBeCloseTo(-tone[1], 6);
  });
});

describe('renderIntervalWav', () => {
  it('renders a playable WAV for a prompt', () => {
    const prompt: EarIntervalPrompt = { interval: 'P4', direction: 'descending', rootMidi: 60 };
    const wav = renderIntervalWav(prompt);
    expect(ascii(wav, 0, 4)).toBe('RIFF');
    const expectedSamples =
      Math.round(LEAD_IN_SECONDS * SAMPLE_RATE) +
      2 * Math.round(TONE_SECONDS * SAMPLE_RATE) +
      Math.round(MELODIC_GAP_SECONDS * SAMPLE_RATE);
    expect(wav.length).toBe(44 + expectedSamples * 2);
  });
});
