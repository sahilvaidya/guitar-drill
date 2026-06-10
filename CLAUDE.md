# Guitar Drill

A fretboard note-identification trainer for iPhone. Offline-only, personal use app built with Expo React Native.

## Key Commands

```bash
npx expo start                                  # dev server (press i for iOS Simulator)
npm test                                        # run unit tests
eas build --platform ios --profile production   # cloud build (~15 min)
eas update --branch production --message "..."  # OTA update to phone (seconds)
```

## Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 56 (React Native) |
| Language | TypeScript (strict) |
| Navigation | Expo Router — file-based, `app/` directory |
| State | Zustand — `src/store/usePracticeSession.ts` |
| Persistence | AsyncStorage — `src/services/statsStore.ts` |
| Fretboard drawing | react-native-svg |
| Tests | Jest + jest-expo |
| Distribution | EAS Build + Transporter → TestFlight |

## Architecture

```
src/
  domain/       pure TS types and logic, no RN deps
                  noteName.ts, guitarString.ts, fretPosition.ts,
                  fretRange.ts, notePracticeMode.ts, quizPrompt.ts,
                  earInterval.ts (ear-training intervals + prompt generation)
  services/     QuizEngine (pure functions), StatsStore (AsyncStorage),
                  ToneSynth (offline Karplus-Strong synth → WAV, pure),
                  EarAudio (expo-audio playback of cached synthesized WAVs)
  store/        Zustand stores, one per drill mode:
                  usePracticeSession.ts, useSpeedGame.ts, useEarTraining.ts
  components/   FretboardView (SVG), AnswerGrid, StatsChips
app/            Expo Router screens
  (tabs)/       bottom tabs: Practice (index), Ear (ear training), Study
  drill.tsx     Note Finder drill loop
  settings.tsx  Settings: mode, fret range, recent misses
__tests__/      Jest unit tests mirroring src/ structure
archived-swift/ Original Swift/SwiftUI project — kept for reference, delete when stable
```

## Iteration Principles

- **Offline-first** — no network calls, no backend, no login
- **Keep the drill loop fast** — answer → feedback → retry if wrong → auto-advance if correct
- **Test with each change** — domain logic, services, and store behavior all have Jest coverage
- **Isolate drill modes** — note-finder behavior must remain stable when new modes are added
- **Persist only lightweight local state** — AsyncStorage, no external DB

## Quality Bar

- App launches with no network connection
- Prompt generation respects selected note set and active fret range
- Persisted stats and settings survive app relaunch
- UI is usable on phone-sized portrait screens
- Unit tests cover note mapping, prompt generation, and stats persistence

## Distribution

- Bundle ID: `com.svaidya.guitardrill`
- Build: `eas build --platform ios --profile production`
- Submit to TestFlight: download `.ipa` from expo.dev → Transporter app → Deliver
- OTA (JS-only changes): `eas update --branch production`

## Product Context

See `roadmap.md` for full product direction, roadmap, completed capabilities, and the current agent task. `README.md` carries the user-facing feature list — update it whenever a roadmap item is completed.
