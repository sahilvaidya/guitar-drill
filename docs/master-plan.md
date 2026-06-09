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
- **Study section framework**: Study home with topic cards (Triads and CAGED available; Scales, Intervals coming soon); Triads screen with Reference / Practice segmented layout
- **Triad domain** (`src/domain/triad.ts`): `TriadQuality` type, interval tables, formula/description/color lookup maps, `triadNotes()` pure function; all four qualities (major/minor/diminished/augmented) covered
- **Triad shapes** (`src/domain/triadShapes.ts`): all 3 closed-position voicings (root pos / 1st inv / 2nd inv) for all 4 qualities on strings G·B·e; `NoteRole` type with display labels; full musical verification via 96 unit tests (interval relationships + spot-checks for C major/minor/dim/aug)
- **TriadDiagramView** (`src/components/TriadDiagramView.tsx`): SVG chord diagram showing 3 strings × 4 fret spaces with role-labelled dots (R solid, others tinted); quality-color-coded; inversion label below
- Triads reference screen: "coming soon" placeholder replaced with horizontally-scrollable row of 3 `TriadDiagramView` instances per quality card; all 4 qualities fully diagrammed
- **Inverse Note Finder drill** (`app/inverse-drill.tsx`): note name shown as prompt; user taps a matching fret position; correct tap reveals all valid positions in green with 1.5s auto-advance; wrong tap flashes red and retries; chromatic mode alternates sharp/flat prompt spellings; separate stats (attempts, solved prompts, best streak) persisted in AsyncStorage; adaptive weighting boosts notes the user has missed; `FretboardView` extended with optional `onPositionTap` and `highlightedPositions` props; `getAllPositionsForNote` domain helper added to `fretPosition.ts`; `generateInversePrompt` service function in `quizEngine.ts`; 15 new unit tests
- **Speed Game** (`app/speed-game.tsx`): time-pressure Note Identification mode. Home's Note Finder card became a "Note Identification" submenu (`app/note-identification.tsx`) with Training (existing drill, unchanged) and Speed Game entries. 3 answer buttons (correct + 2 distractors from nearby fretboard positions / adjacent half-steps, `src/domain/speedGameDistractors.ts`); correct answers advance immediately, wrong taps add a 6s penalty; game over when the rolling 5-prompt average response time exceeds 5s (`src/domain/speedGame.ts`). Live stock chart of response times (`src/components/ResponseTimeChart.tsx`) with a red 5s danger line and line color shifting green → amber → red as the average climbs. Game state in `src/store/useSpeedGame.ts` (zustand, injectable clock/rng for tests); `speedGameBestScore` persisted via `statsStore.ts`; respects practice mode (natural/chromatic incl. sharp/flat alternation) and active fret range; 34 new unit tests (distractors, rolling average, game-over trigger, store flow, best-score persistence)
- **CAGED study section** (`app/(tabs)/study/caged.tsx`): four segments — Pentatonic boxes, full Scale positions, two-string 3rds, and two-string 6ths. Pentatonic and Scale segments show all five CAGED boxes up the neck with a Major/Minor toggle that relabels every dot's scale degree and root (same fingerings, relative-key framing: C major / A minor). Thirds harmonize one octave on each adjacent pair of the first four strings (e+B, B+G, G+D); sixths skip a string (e+G, B+D), with M/m interval quality labelled per pair. Domain data in `src/domain/cagedShapes.ts` (boxes as moveable fret offsets, degree labels derived from pitch classes, `buildDiatonicRun` generator); diagrams via `ScaleBoxDiagramView` (6-string box) and `IntervalRunView` (scrollable two-string run); musical correctness verified by unit tests

## Quality Bar

- App launches with no network connection
- Note-finder behavior is unchanged by additions to other screens or modes
- Prompt generation respects selected note set and active fret range
- Persisted stats and settings survive app relaunch
- UI is usable on phone-sized portrait screens
- Unit tests cover domain, prompt, stats, and persistence behavior

## Near-Term Roadmap

### Goal 3 — Add new info in one place

- **Bookmarking / favorites** — a star button on any reference diagram (triad shape, chord voicing, scale pattern) that saves it to a "My Saved Shapes" list. The list lives in AsyncStorage and is accessible from a dedicated tab or section for quick review. Simpler entry point before a full library.

- **Personal Library ("My Library")** — a section where the user can save chord shapes, scale patterns, fingering notes, and free-text observations. Each entry has a type (chord / scale / note), a label the user sets, and an optional diagram snapshot. "Save to My Library" button appears on any generated diagram. Persisted in AsyncStorage. Acts as the single place to capture things learned outside the app (from lessons, YouTube, etc.).

### Goal 2 — Learn fretboard and chords better

- **Open & barre chord reference** — a "Chords" topic card in the Study section. Browse by root note → chord quality → voicing. Covers at minimum: open position (G, C, D, A, E, Am, Em, Dm) and moveable barre forms (E-shape and A-shape). Uses the same `TriadDiagramView` chord diagram component, extended to show 6 strings and standard fingering numbers.

- **Scales module** — a "Scales" topic card in the Study section with two sub-sections:
  - *Reference*: select a root note + mode (major, natural minor, pentatonic major/minor, blues); the full fretboard SVG highlights all notes of that scale with the root in a distinct color.
  - *Drill*: a position is highlighted; the user names the scale degree (1–7) or identifies whether it's in the selected scale. Respects active fret range.

- **CAGED system reference** — **Partially completed.** The CAGED topic card now opens a reference with pentatonic boxes, scale positions, and two-string thirds/sixths (see Completed Capabilities). Remaining idea from the original scope: per-shape chord-tone overlays (chord tones colored with scale tones of the same key faded in) connecting the five chord shapes into a continuous map.

- **Interval recognition drill** — a new drill mode (Practice tab). Two fret positions are highlighted; the user names the interval (e.g. P5, M3, m7). Alternatively: given a root position, tap the fret that is a specified interval away. Covers all diatonic intervals; chromatic optional. New domain file `src/domain/interval.ts`; new drill screen `app/intervals.tsx`.

### Goal 1 — Practice / remember what you know

- **Triad practice drill** — fill in the stubbed Practice tab on the Triads screen. Show a triad quality and root; the user selects the correct set of notes from an answer grid (or taps positions on the fretboard). Uses `triadNotes()` from `src/domain/triad.ts`. Adaptive weighting applies the same way as the Note Finder.

- ~~**Inverse note finder**~~ — **Completed.** See Completed Capabilities above.

- **Spaced repetition / review sessions** — a "Review" entry point (on the Home or Practice tab) that surfaces items due today based on a lightweight SRS schedule (e.g. SM-2 variant). Each item is a fret position, chord shape, or scale pattern. Review history stored in AsyncStorage alongside existing stats. Complements the existing adaptive engine (which weights by miss frequency) with a time-based forgetting curve.

## Later Roadmap

### Bonus

- **Scale degree drills** — given a highlighted scale pattern on the fretboard, the user identifies the scale degree of a highlighted note (e.g. "what degree is this in G major?"). Bridges music theory vocabulary to physical fretboard positions.

- **Chord progression trainer** — show a progression (e.g. ii–V–I in G) and let the user practice finding the chord voicings up the neck in sequence. Teaches functional harmony and common movement patterns.

- ~~**Speed Game**~~ — **Completed.** See Completed Capabilities above. Original spec follows for reference:
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

## Next Agent Task

Add a **root-note picker** to the Triads reference screen so shapes can be browsed in any key.

Context:
- `app/(tabs)/study/triads.tsx` — the Triads screen; each quality card has a horizontally-scrollable row of 3 `TriadDiagramView` instances showing generic moveable shapes (G·B·e strings)
- `src/domain/triadShapes.ts` — `TRIAD_SHAPES` with `offsets` + `roles` per shape; no key-specific logic yet
- `src/domain/triad.ts` — `triadNotes(rootPitchClass, quality)` returns the 3 note names; `chromaticNotes` lists all 12 pitch classes

Implementation order:
1. Read this file and `CLAUDE.md`; review the files above
2. **Root-note picker** — add to `triadShapes.ts` (or `triad.ts`): a helper `baseFretForShape(shape, rootPitchClass)` that, given a moveable shape and a root pitch class, returns the base fret where the root string lands on the neck (so the diagram can show the actual fret number)
3. **Update `TriadDiagramView`** — add an optional `baseFret?: number` prop; when provided, show a small fret-number label to the left of the diagram (e.g. "5fr") so the player knows where to position their hand; omit label when `baseFret` is 0 (open position)
4. **Root-note picker UI** — add a horizontally-scrollable row of 12 root buttons (A–G + accidentals, using natural names by default) at the top of the Reference section, above the quality cards; selected root stored in component state (default: C)
5. **Wire up** — pass the selected root pitch class into each `TriadCard`; compute `baseFret` for each shape via the helper; pass it to `TriadDiagramView`; also update the "Example (C):" note pills row to reflect the selected root
6. Add unit tests for `baseFretForShape` (verify fret numbers for a handful of root/shape combinations match known guitar positions)
7. Update master-plan.md and commit

Acceptance criteria:
- Tapping "G" shows all shape diagrams shifted to the G position with correct fret numbers
- "Example (C):" label updates to reflect the selected root (e.g. "Example (G):")
- Note pills show the correct notes for the selected root
- Open-position shapes (base fret = 0) omit the fret label
- All existing tests still pass
