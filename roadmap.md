# Guitar Drill — Roadmap

## Product Direction

Guitar Drill is an iPhone app for memorizing guitar notes on a standard-tuned fretboard. The app has a complete offline note-finder drill: it shows a highlighted fretboard position, asks the user to choose the note name, gives immediate feedback, and advances automatically after a correct answer.

Future work should build on that working loop instead of treating the app like a greenfield scaffold. Keep each change small, testable, and useful on-device.

## Current Product

- Portrait-first iPhone app (Expo React Native, fully offline)
- Standard-tuned six-string fretboard, frets 0–12
- Natural-note practice by default; optional chromatic mode with combined accidentals (C#/Db)
- Practice tab: Note Identification (Training drill + Speed Game), Inverse Note Finder, and the Chord Detector tool
- Ear tab: Interval Training drill with on-device tone synthesis (Note ID, Chord ID, Melodic Dictation planned)
- Study tab: Chord Shapes library, Triads reference, and CAGED system (pentatonics, scale positions, thirds/sixths)
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
- **Study section framework**: Study home with topic cards (Chord Shapes, Triads, and CAGED available; Scales, Intervals coming soon); Triads screen with Reference / Practice segmented layout
- **Triad domain** (`src/domain/triad.ts`): `TriadQuality` type, interval tables, formula/description/color lookup maps, `triadNotes()` pure function; all four qualities (major/minor/diminished/augmented) covered
- **Triad shapes** (`src/domain/triadShapes.ts`): all 3 closed-position voicings (root pos / 1st inv / 2nd inv) for all 4 qualities on strings G·B·e; `NoteRole` type with display labels; full musical verification via 96 unit tests (interval relationships + spot-checks for C major/minor/dim/aug)
- **TriadDiagramView** (`src/components/TriadDiagramView.tsx`): SVG chord diagram showing 3 strings × 4 fret spaces with role-labelled dots (R solid, others tinted); quality-color-coded; inversion label below
- Triads reference screen: "coming soon" placeholder replaced with horizontally-scrollable row of 3 `TriadDiagramView` instances per quality card; all 4 qualities fully diagrammed
- **Inverse Note Finder drill** (`app/inverse-drill.tsx`): note name shown as prompt; user taps a matching fret position; correct tap reveals all valid positions in green with 1.5s auto-advance; wrong tap flashes red and retries; chromatic mode alternates sharp/flat prompt spellings; separate stats (attempts, solved prompts, best streak) persisted in AsyncStorage; adaptive weighting boosts notes the user has missed; `FretboardView` extended with optional `onPositionTap` and `highlightedPositions` props; `getAllPositionsForNote` domain helper added to `fretPosition.ts`; `generateInversePrompt` service function in `quizEngine.ts`; 15 new unit tests
- **Chord Detector** (`app/chord-detector.tsx`): interactive tool on the Practice tab — tap fretboard positions (one note per string, open strings supported, tap again to mute) and the app names the chord live. Detection in `src/domain/chordDetect.ts` covers the essentials: major, minor, dim, sus2, sus4, dominant 7th, major 7th, minor 7th, dim7, plus shell voicings (omitted 5th) for 7th chords and slash naming (e.g. C/E, D/F#) when the lowest sounding note isn't the root. Ambiguous sets (sus2/sus4, symmetric dim7) resolve to the bass-rooted reading with alternates listed. Root notes highlighted orange, other tones blue, note names inside the dots (`FretboardView` gained an optional highlight `label`); conventional accidental spellings (C#, Eb, F#, Ab, Bb); 17 unit tests including real open-shape voicings
- **Speed Game** (`app/speed-game.tsx`): time-pressure Note Identification mode. Home's Note Finder card became a "Note Identification" submenu (`app/note-identification.tsx`) with Training (existing drill, unchanged) and Speed Game entries. 3 answer buttons (correct + 2 distractors from nearby fretboard positions / adjacent half-steps, `src/domain/speedGameDistractors.ts`); correct answers advance immediately, wrong taps add a 6s penalty; game over when the rolling 5-prompt average response time exceeds 5s (`src/domain/speedGame.ts`). Live stock chart of response times (`src/components/ResponseTimeChart.tsx`) with a red 5s danger line and line color shifting green → amber → red as the average climbs. Game state in `src/store/useSpeedGame.ts` (zustand, injectable clock/rng for tests); `speedGameBestScore` persisted via `statsStore.ts`; respects practice mode (natural/chromatic incl. sharp/flat alternation) and active fret range; 34 new unit tests (distractors, rolling average, game-over trigger, store flow, best-score persistence)
- **Chord Shapes library** (`app/(tabs)/study/chords.tsx`): a "Chord Shapes" topic card in the Study section with classic vertical chord charts (`src/components/ChordDiagramView.tsx`: nut/base-fret, X/O markers, barre bar, finger numbers, orange roots). Sections: open chords (C A G E D Am Em Dm), open 7th chords (G7 C7 D7 A7 E7 B7), suspended chords (Asus2/4, Dsus2/4, Esus4), barre chords with root on the 6th string (E-family: major, minor, 7, m7, plus the moveable 6th-root maj7 voicing), barre chords with root on the 5th string (A-family: major, minor, 7, m7, maj7), and power chords (6th- and 5th-string root). A root-note picker transposes all moveable shapes to any key, showing real fret positions and chord names. Shape data in `src/domain/chordShapes.ts`; every voicing (including all 12 transpositions of each moveable shape) is verified against the chord detector in unit tests
- **CAGED study section** (`app/(tabs)/study/caged.tsx`): four segments — Pentatonic boxes, full Scale positions, two-string 3rds, and two-string 6ths. Pentatonic and Scale segments show all five CAGED boxes up the neck with a Major/Minor toggle that relabels every dot's scale degree and root (same fingerings, relative-key framing: C major / A minor). Thirds harmonize one octave on each adjacent pair of the first four strings (e+B, B+G, G+D); sixths skip a string (e+G, B+D), with M/m interval quality labelled per pair. Domain data in `src/domain/cagedShapes.ts` (boxes as moveable fret offsets, degree labels derived from pitch classes, `buildDiatonicRun` generator); diagrams via `ScaleBoxDiagramView` (6-string box) and `IntervalRunView` (scrollable two-string run); musical correctness verified by unit tests

- **Ear Training section** (new "Ear" bottom tab): section home (`app/(tabs)/ear/index.tsx`) with topic cards mirroring the Study framework — Interval Training live; Note Identification, Chord Identification, and Melodic Dictation as coming-soon cards. **Interval Training drill** (`app/(tabs)/ear/intervals.tsx`): hear two notes, name the interval; wrong answers retry with replay, correct answers reveal the full interval name + a reference-song hint (e.g. P5 → Star Wars) and auto-advance after 1.5s. Direction setting (ascending / descending / harmonic / mixed) and three difficulty levels (beginner 5 / intermediate 9 / advanced 12 intervals), both persisted. Audio is fully offline: Karplus-Strong plucked-string synthesis in pure TS (`src/services/toneSynth.ts`) renders each prompt to a 16-bit WAV cached via `expo-file-system` and played with `expo-audio` (`src/services/earAudio.ts`, plays in iPhone silent mode). Domain logic in `src/domain/earInterval.ts` (interval tables, prompt generation within the guitar register E2–E5, no immediate interval repeats); session flow in `src/store/useEarTraining.ts`; lifetime stats + settings in `statsStore.ts`. 40 new unit tests (interval domain, WAV synthesis incl. periodicity check, store flow, persistence). Note: adds native modules — requires a new EAS build, not just an OTA update

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

- **Scales module** — a "Scales" topic card in the Study section with two sub-sections:
  - *Reference*: select a root note + mode (major, natural minor, pentatonic major/minor, blues); the full fretboard SVG highlights all notes of that scale with the root in a distinct color.
  - *Drill*: a position is highlighted; the user names the scale degree (1–7) or identifies whether it's in the selected scale. Respects active fret range.

- **CAGED chord-tone overlays** — extend the existing CAGED study section with per-shape chord-tone overlays: chord tones colored with scale tones of the same key faded in, connecting the five chord shapes into a continuous map.

- **Interval recognition drill** — a new drill mode (Practice tab). Two fret positions are highlighted; the user names the interval (e.g. P5, M3, m7). Alternatively: given a root position, tap the fret that is a specified interval away. Covers all diatonic intervals; chromatic optional. New domain file `src/domain/interval.ts`; new drill screen `app/intervals.tsx`.

### Goal 4 — Ear training expansion

The Ear tab framework (section home with topic cards, offline tone synthesis in `src/services/toneSynth.ts`, playback in `src/services/earAudio.ts`) is built; these fill in the coming-soon cards. Each new drill should follow the Interval Training pattern: domain file → zustand store → screen, with stats and settings persisted in `statsStore.ts`.

- **Note identification (ear)** — hear a single synthesized note, name it (A–G, chromatic optional). Builds a pitch reference anchored to the guitar register. Optionally show the answer's fretboard positions after a correct guess to tie ear to fretboard. New screen `app/(tabs)/ear/notes.tsx`; reuses `pluck()` + a single-note WAV renderer.

- **Chord quality identification** — hear a strummed or block chord, name its quality (major, minor, dim, sus2, sus4, 7th qualities by level). Synthesis: mix 3–4 plucks with slight onset stagger to mimic a strum. Chord spellings can come from `src/domain/triad.ts` and `src/domain/chordDetect.ts` interval tables. New screen `app/(tabs)/ear/chords.tsx`.

- **Melodic dictation** — hear a short 3–5 note phrase in a stated key, play it back by tapping fret positions (reuses `FretboardView` tap support from the Inverse Note Finder). Start with stepwise diatonic phrases; grade per-note with retry.

- **Interval drill enhancements** — adaptive weighting of missed intervals (reuse the `WeightingStrategy` idea from `src/services/adaptiveEngine.ts`), per-interval accuracy breakdown, and an optional "play as fretboard positions" reveal connecting the heard interval to shapes on the neck.

### Goal 1 — Practice / remember what you know

- **Triad practice drill** — fill in the stubbed Practice tab on the Triads screen. Show a triad quality and root; the user selects the correct set of notes from an answer grid (or taps positions on the fretboard). Uses `triadNotes()` from `src/domain/triad.ts`. Adaptive weighting applies the same way as the Note Finder.

- **Spaced repetition / review sessions** — a "Review" entry point (on the Home or Practice tab) that surfaces items due today based on a lightweight SRS schedule (e.g. SM-2 variant). Each item is a fret position, chord shape, or scale pattern. Review history stored in AsyncStorage alongside existing stats. Complements the existing adaptive engine (which weights by miss frequency) with a time-based forgetting curve.

## Later Roadmap

### Bonus

- **Scale degree drills** — given a highlighted scale pattern on the fretboard, the user identifies the scale degree of a highlighted note (e.g. "what degree is this in G major?"). Bridges music theory vocabulary to physical fretboard positions.

- **Chord progression trainer** — show a progression (e.g. ii–V–I in G) and let the user practice finding the chord voicings up the neck in sequence. Teaches functional harmony and common movement patterns.

- **Chord naming quiz** — show a chord shape on the fretboard, ask the user to name it (the reverse of the Chord Detector tool; detection logic in `src/domain/chordDetect.ts` can generate and validate prompts).
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
7. Update roadmap.md and commit

Acceptance criteria:
- Tapping "G" shows all shape diagrams shifted to the G position with correct fret numbers
- "Example (C):" label updates to reflect the selected root (e.g. "Example (G):")
- Note pills show the correct notes for the selected root
- Open-position shapes (base fret = 0) omit the fret label
- All existing tests still pass
