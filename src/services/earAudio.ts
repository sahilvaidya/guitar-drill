// Playback for synthesized ear-training audio. Renders each prompt to a WAV
// in the cache directory (offline, no bundled assets) and plays it with
// expo-audio. Kept separate from toneSynth.ts so synthesis stays pure and
// unit-testable without native modules.

import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { EarIntervalPrompt } from '@/domain/earInterval';
import { SAMPLE_RATE, encodeWavPcm16, renderIntervalWav } from './toneSynth';

let player: AudioPlayer | null = null;
let loadedUri: string | null = null;
let keepAlivePlayer: AudioPlayer | null = null;
let audioModeReady = false;

// Bump when the rendered audio format changes so stale cached WAVs are bypassed.
const SYNTH_VERSION = 2;

function promptFileName(prompt: EarIntervalPrompt): string {
  return `ear-v${SYNTH_VERSION}-${prompt.rootMidi}-${prompt.interval}-${prompt.direction}.wav`;
}

function ensureCachedWav(prompt: EarIntervalPrompt): File {
  const file = new File(Paths.cache, promptFileName(prompt));
  if (!file.exists) {
    file.create();
    file.write(renderIntervalWav(prompt));
  }
  return file;
}

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  // Drill audio should sound even with the iPhone ring/silent switch on silent.
  await setAudioModeAsync({ playsInSilentMode: true });
  audioModeReady = true;
}

/**
 * Loops a silent buffer at zero volume while the drill screen is open. iOS
 * powers the audio output down after a few seconds of silence and swallows
 * the start of whatever plays next; keeping the pipeline rendering means
 * prompt playback always starts instantly and unclipped.
 */
export async function startAudioKeepAlive(): Promise<void> {
  if (keepAlivePlayer) return;
  await ensureAudioMode();
  const file = new File(Paths.cache, `ear-v${SYNTH_VERSION}-silence.wav`);
  if (!file.exists) {
    file.create();
    file.write(encodeWavPcm16(new Float32Array(SAMPLE_RATE))); // 1s of silence
  }
  keepAlivePlayer = createAudioPlayer({ uri: file.uri });
  keepAlivePlayer.loop = true;
  keepAlivePlayer.volume = 0;
  keepAlivePlayer.play();
}

export async function playIntervalPrompt(prompt: EarIntervalPrompt): Promise<void> {
  await ensureAudioMode();
  const file = ensureCachedWav(prompt);

  // Reuse a single player: restarting it from the top means repeated Replay
  // taps can never layer multiple copies of the audio over each other.
  if (player && loadedUri === file.uri) {
    await player.seekTo(0);
    player.play();
    return;
  }

  player?.pause();
  player?.remove();
  player = createAudioPlayer({ uri: file.uri });
  loadedUri = file.uri;
  player.play();
}

export function stopIntervalAudio(): void {
  player?.pause();
  player?.remove();
  player = null;
  loadedUri = null;
  keepAlivePlayer?.pause();
  keepAlivePlayer?.remove();
  keepAlivePlayer = null;
}
