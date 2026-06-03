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
- Unit tests: note mapping, quiz engine, stats persistence (38 tests)
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

- Add an adaptive practice algorithm: use recent misses and weak fret positions to increase the probability of seeing difficult spots without fully removing normal random review

## Later Roadmap

- Chord detector mode: show a chord shape on the fretboard, ask the user to identify it
- Chord builder mode: give a chord name, ask the user to place the notes
- Chord progression trainer: practice common progressions and functional movement
- Inverse note detector: give a note name, user taps a matching fretboard location

## Next Agent Task

Add an adaptive practice algorithm for the Note Finder drill. Currently, prompts are selected uniformly at random from all positions in the active fret range. The goal is to weight selection toward positions the user gets wrong more often, without fully removing random review of other positions.

Implementation guidance:
1. Read this file and `CLAUDE.md` for full context
2. Explore `src/services/statsStore.ts` (RecentMiss, LifetimeStats) and `src/services/quizEngine.ts` (makeRandomPrompt) — the algorithm should live in a new or extended quiz engine function
3. Design a weighted selection: positions with recent misses or historically high error rates get higher weight; all positions retain some minimum weight so nothing is permanently skipped
4. Add a `makeWeightedPrompt(config, recentMisses, exclude?)` function to quizEngine (or a new adaptiveEngine service), with unit tests covering: miss-heavy positions get higher weight, no-miss positions still appear, exclude still works
5. Wire the weighted prompt into `usePracticeSession.nextPrompt()` and `initialize()` — pass `recentMisses` from store state
6. No new persistence needed; recentMisses is already stored (last 5)
7. Update master-plan.md and commit
