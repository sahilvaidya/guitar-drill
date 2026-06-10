// Playback for synthesized ear-training audio. Renders each prompt to a WAV
// in the cache directory (offline, no bundled assets) and plays it with
// expo-audio. Kept separate from toneSynth.ts so synthesis stays pure and
// unit-testable without native modules.

import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { EarIntervalPrompt } from '@/domain/earInterval';
import { renderIntervalWav } from './toneSynth';

let player: AudioPlayer | null = null;
let loadedUri: string | null = null;
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

export async function playIntervalPrompt(prompt: EarIntervalPrompt): Promise<void> {
  if (!audioModeReady) {
    // Drill audio should sound even with the iPhone ring/silent switch on silent.
    await setAudioModeAsync({ playsInSilentMode: true });
    audioModeReady = true;
  }
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
}
