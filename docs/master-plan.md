# Guitar Drill — Master Plan

## Product Direction

Guitar Drill is an iPhone app for memorizing guitar notes on a standard-tuned fretboard. The app has a complete offline note-finder drill: it shows a highlighted fretboard position, asks the user to choose the note name, gives immediate feedback, and advances automatically after a correct answer.

Future work should build on that working loop instead of treating the app like a greenfield scaffold. Keep each change small, testable, and useful on-device.

## Current Product

- Portrait-first iPhone app (Expo React Native, fully offline)
- Standard-tuned six-string fretboard, frets 0–12
- Natural-note practice by default; optional chromatic mode with combined accidentals (C#/Db)
- Home screen for drill mode selection (Note Finder available; future modes stubbed)
- Note Finder drill screen with fretboard visualization, answer grid, and auto-advance
- Settings screen: mode toggle, fret range steppers, recent misses list
- Session and lifetime stats persisted locally
- No backend, sync, login, or network dependency

## Stack

See `CLAUDE.md` for the full stack, architecture, and key commands.

## Iteration Principles

- Preserve offline-first behavior
- Prefer incremental improvements over broad rewrites
- Keep the note-finder loop fast: answer → feedback → retry → auto-advance
- Keep future drill modes isolated so note-finder stays stable
- Add or update tests with each behavior change
- Update this plan whenever the next implementation target changes

## Completed Capabilities

- SwiftUI iPhone app (archived in `archived-swift/`)
- Migrated to Expo SDK 56 / React Native / TypeScript
- Standard-tuned six-string fretboard renders frets 0–12 with one active prompt dot
- Natural-note quiz loop (A–G answers)
- Chromatic mode with sharp/flat alternation: each prompt randomly shows all-sharp (A#) or all-flat (Bb) spellings so the user learns both; `normalizeToCanonical()` maps display spellings back to canonical NoteName for evaluation and stats
- Wrong answers show feedback and keep the current prompt active for retry
- Correct answers auto-advance after 1.5s delay
- Session and lifetime stats: attempts, solved prompts, first-try correct, incorrect guesses, best streak
- Correct-answer timing: last solve time + running average of last 5, color-coded green/red
- Settings: mode toggle, persisted fret range, recent misses list
- Prompt generation respects active fret range and practice mode
- Fretboard: marker dots at frets 3, 5, 7, 9; nut rendered at left edge
- Unit tests: note mapping, quiz engine, stats persistence, adaptive engine (47 tests)
- Adaptive practice algorithm: `missCountStrategy` weights missed positions 5× higher; `WeightingStrategy` interface makes the algorithm pluggable
- Home screen scaffold with Note Finder entry and disabled placeholders for future modes
- Expo Router navigation: Home → Drill → Settings
- EAS Build pipeline with TestFlight distribution

## Quality Bar

- App launches with no network connection
- Note-finder behavior is unchanged by additions to other screens or modes
- Prompt generation respects selected note set and active fret range
- Persisted stats and settings survive app relaunch
- UI is usable on phone-sized portrait screens
- Unit tests cover domain, prompt, stats, and persistence behavior

## Near-Term Roadmap

## Later Roadmap

- **Speed Game** (Note Identification game mode) — a time-pressure drill where the player must keep a rolling average response time below a threshold or face game over, visualized as a live stock chart.
  - **Navigation**: Home screen "Note Finder" card becomes a "Note Identification" submenu with two entries — **Training** (current drill, unchanged) and **Speed Game** (new).
  - **Drill loop**: Same fretboard view with a highlighted position. Shows **3 answer buttons** (1 correct + 2 distractors — notes nearby on the fretboard or adjacent half-steps). Correct tap → immediate advance (no 1.5s delay). Wrong tap → +6s time penalty added to the rolling average; prompt retries.
  - **Lose condition**: When the rolling 5-prompt average response time exceeds **5 seconds**, game over. Shows final score (# correct prompts), personal best, "Play Again" / "Home".
  - **Stock chart**: Embedded above the answer buttons. X-axis = prompt number, Y-axis = response time in seconds. Each answer plots a point connected into a live line. A red horizontal danger line marks the 5s threshold. Line color shifts toward red as average approaches threshold.
  - **Persistence**: `speedGameBestScore` (int, prompt count) added to AsyncStorage via `statsStore.ts`.
  - **New files**: `app/speed-game.tsx` (drill screen), `app/note-identification.tsx` (submenu screen), `src/domain/speedGameDistractors.ts` (distractor picking logic), `src/store/useSpeedGame.ts` (rolling average, game state).
  - **Settings respected**: Active fret range and practice mode (natural/chromatic) apply; chromatic mode uses same sharp/flat alternation.
  - **Acceptance criteria**: Submenu entry works; 3 buttons always include correct answer; chart updates live; game over fires at 5s average; penalty mechanic works; best score persists; Training mode is unchanged.
  - **Tests**: Unit tests for distractor generation (always 2 distinct wrong notes, both modes), rolling average calculation (window of 5, < 5 samples), and game-over trigger logic.

- Chord detector mode: show a chord shape on the fretboard, ask the user to identify it
- Chord builder mode: give a chord name, ask the user to place the notes
- Chord progression trainer: practice common progressions and functional movement
- Inverse note detector: give a note name, user taps a matching fretboard location

## Next Agent Task

Implement the **Speed Game** mode (see Later Roadmap for full spec). This is the next major feature: a time-pressure drill where the rolling 5-prompt average response time drives a live line chart and triggers game over when it exceeds 5 seconds.

Implementation order:
1. Read this file and `CLAUDE.md` for full context
2. Create `src/domain/speedGameDistractors.ts` — distractor picking logic (2 wrong notes distinct from the correct answer; support both natural and chromatic modes)
3. Create `src/store/useSpeedGame.ts` — rolling average (window of 5), game state (active/gameover), score, penalty mechanic (+6s on wrong tap)
4. Add `speedGameBestScore` to `statsStore.ts` — persisted via AsyncStorage
5. Create `app/note-identification.tsx` — submenu screen with "Training" and "Speed Game" entries
6. Update `app/index.tsx` — "Note Finder" card now navigates to the note-identification submenu
7. Create `app/speed-game.tsx` — drill screen: fretboard, 3 answer buttons, live stock chart (react-native-svg), game-over overlay
8. Tests: distractor generation (always 2 distinct wrong notes, both modes), rolling average (window of 5, <5 samples), game-over trigger logic
9. Update master-plan.md and commit
