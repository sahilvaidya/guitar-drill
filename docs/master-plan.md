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
- Unit tests: note mapping, quiz engine, stats persistence, adaptive engine, triad domain (56 tests)
- Adaptive practice algorithm: `missCountStrategy` weights missed positions 5× higher; `WeightingStrategy` interface makes the algorithm pluggable
- Home screen scaffold with Note Finder entry and disabled placeholders for future modes
- Expo Router navigation: Home → Drill → Settings
- EAS Build pipeline with TestFlight distribution
- **Bottom tab navigation**: Practice tab (existing drills) + Study tab (new reference section)
- **Study section framework**: Study home with topic cards (Triads available; Scales, Intervals, CAGED coming soon); Triads screen with Reference / Practice segmented layout
- **Triad domain** (`src/domain/triad.ts`): `TriadQuality` type, interval tables, formula/description/color lookup maps, `triadNotes()` pure function; all four qualities (major/minor/diminished/augmented) covered

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

Flesh out the **Triads reference screen** with real fretboard shape content and root-note browsing.

Context: `app/(tabs)/study/triads.tsx` already has the Reference/Practice segmented layout and 4 triad quality cards (major/minor/diminished/augmented). Each card has a "Fretboard shapes — coming soon" placeholder. The domain logic lives in `src/domain/triad.ts`.

Implementation order:
1. Read this file and `CLAUDE.md`; review `app/(tabs)/study/triads.tsx` and `src/domain/triad.ts`
2. **Root-note picker** — add a horizontally-scrollable row of root-note buttons (A–G natural notes; optionally chromatic) above the quality cards so the user can browse shapes for any root
3. **Fretboard shape data** — add to `src/domain/triad.ts` (or a new `src/domain/triadShapes.ts`): the standard closed-position shapes for major and minor triads across the 6 strings (at minimum the three string-set groupings: strings 1–3, 2–4, 3–5). Data structure: `{ stringSet, baseFret, fingerPositions[] }`.
4. **Shape diagrams** — create `src/components/TriadDiagramView.tsx` using react-native-svg: a small 4-fret × 3-string chord diagram with finger dots, nut indicator, and muted-string markers. Reuse the existing SVG patterns from `FretboardView.tsx`.
5. Replace the "coming soon" placeholder in each `TriadCard` with a horizontal scroll of `TriadDiagramView` instances for the selected root note.
6. Diminished and augmented shapes can remain as "coming soon" placeholders in this pass (they are less common and need more shapes).
7. Add unit tests for any shape-selection or transposition logic.
8. Update master-plan.md and commit.

Acceptance criteria:
- Tapping a root note (e.g. "G") updates all four quality cards to show shapes for that root
- Major and minor cards show at least 2 fretboard diagrams each
- Diagrams are correct (finger positions match the triad notes for the selected root)
- Diminished/augmented cards retain the "coming soon" placeholder for now
- All existing tests still pass
