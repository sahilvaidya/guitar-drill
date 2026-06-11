// Playback for synthesized ear-training audio. Renders each prompt to a WAV
// in the cache directory (offline, no bundled assets) and plays it with
// expo-audio. Kept separate from toneSynth.ts so synthesis stays pure and
// unit-testable without native modules.

import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { EarIntervalPrompt } from '@/domain/earInterval';
import { encodeWavPcm16, keepAliveTone, renderIntervalWav, renderNoteWav } from './toneSynth';

let player: AudioPlayer | null = null;
let keepAlivePlayer: AudioPlayer | null = null;
let audioModeReady = false;

// Bump when the rendered audio format changes so stale cached WAVs are bypassed.
const SYNTH_VERSION = 3;

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
 * Loops a sub-audible tone while the drill screen is open. Speaker and
 * Bluetooth output stages power down on digital silence (zero-volume or
 * silent buffers don't hold them awake) and clip the attack of the next
 * sound while waking back up; an inaudible non-silent signal keeps them
 * rendering so prompt playback always starts intact.
 */
export async function startAudioKeepAlive(): Promise<void> {
  if (keepAlivePlayer) return;
  await ensureAudioMode();
  const file = new File(Paths.cache, `ear-v${SYNTH_VERSION}-keepalive.wav`);
  if (!file.exists) {
    file.create();
    file.write(encodeWavPcm16(keepAliveTone()));
  }
  keepAlivePlayer = createAudioPlayer({ uri: file.uri });
  keepAlivePlayer.loop = true;
  keepAlivePlayer.play();
}

export async function playIntervalPrompt(prompt: EarIntervalPrompt): Promise<void> {
  await ensureAudioMode();
  const file = ensureCachedWav(prompt);

  // Recreate the player per play: pausing the old one first prevents replays
  // from layering, and a fresh player always starts at sample zero (seekTo on
  // iOS is tolerance-based and not guaranteed to land exactly at the start).
  player?.pause();
  player?.remove();
  player = createAudioPlayer({ uri: file.uri });
  player.play();
}

export async function playNotePrompt(midi: number): Promise<void> {
  await ensureAudioMode();
  const fileName = `ear-note-v${SYNTH_VERSION}-${midi}.wav`;
  const file = new File(Paths.cache, fileName);
  if (!file.exists) {
    file.create();
    file.write(renderNoteWav(midi));
  }

  player?.pause();
  player?.remove();
  player = createAudioPlayer({ uri: file.uri });
  player.play();
}

export function stopIntervalAudio(): void {
  player?.pause();
  player?.remove();
  player = null;
  keepAlivePlayer?.pause();
  keepAlivePlayer?.remove();
  keepAlivePlayer = null;
}
