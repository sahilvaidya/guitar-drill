# Fretboard Trainer Master Plan

## Product Direction
Fretboard Trainer is a native iPhone app for memorizing guitar notes on a standard-tuned fretboard. The app already has a complete offline note-finder drill: it shows one highlighted fretboard position, asks the user to choose the note name, gives immediate feedback, and advances automatically after a correct answer.

Future work should build on that working loop instead of treating the app like a greenfield scaffold. Keep each change small, testable, and useful on-device.

## Current Product
- Portrait-first native iPhone app.
- Fully offline and local-only.
- Standard-tuned six-string fretboard.
- Frets `0...12`, with fret `0` rendered on the nut/left edge and frets `1...12` rendered as the visible fret spaces.
- Natural-note practice by default, with an optional chromatic mode using combined accidental labels such as `C#/Db`.
- Settings sheet for note set, active fret range, and recent misses.
- Session and lifetime stats persisted locally.
- No backend, sync, login, or network dependency.

## Stack And Architecture
- Platform: native iOS app
- UI: `SwiftUI`
- Language: `Swift`
- State model: `@Observable` objects with SwiftUI bindings
- Persistence: `UserDefaults` for local stats and settings
- Testing: `XCTest` unit tests plus `XCUITest` drill-flow smoke coverage

Core components:
- `NoteName`: natural and chromatic answer choices.
- `NotePracticeMode`: natural-only or chromatic practice mode.
- `GuitarString`: standard tuning string definitions.
- `FretPosition`: string + fret with computed note lookup.
- `QuizPrompt`: displayed fretboard position plus correct answer.
- `QuizEngine`: prompt generation and answer evaluation.
- `StatsStore`: local persistence for stats, settings, fret range, and recent misses.
- `PracticeSession`: observable state for the active drill loop.
- `FretboardView`: fretboard renderer and prompt-dot placement.
- `ContentView`: current note-finder drill screen and settings entry point.

## Iteration Principles
- Preserve offline-first behavior; new features should work with no network connection.
- Prefer incremental drill improvements over broad rewrites.
- Persist only lightweight local state unless a feature clearly needs more.
- Keep the note-finder loop fast: answer, feedback, retry if wrong, auto-advance if correct.
- Keep future drill modes separate enough that the existing note-finder behavior remains stable.
- Add or update tests with each behavior change, especially around persistence, prompt generation, and navigation.
- Update this plan whenever the next implementation target changes.

## Completed Capabilities
- Native SwiftUI iPhone project scaffolded with offline-only app architecture.
- Standard-tuned six-string fretboard renders frets `0...12` with one active prompt dot.
- Natural-note-only quiz loop generates prompts and accepts `A` through `G` answers.
- Chromatic practice mode generates prompts for all pitch classes and offers combined sharp/flat accidental answer choices.
- Natural-note-only practice remains the default selectable mode.
- Wrong answers show immediate incorrect feedback and keep the current prompt active.
- The user can retry bad answers until selecting the correct note.
- Correct answers show brief success feedback and automatically advance without a manual `Next Note` button.
- Session and lifetime stats distinguish attempts, solved prompts, first-try correct answers, repeated incorrect guesses, and best streak.
- Settings provide the natural/chromatic mode toggle, a persisted active fret range within `0...12`, and a locally persisted recent-misses review list.
- Prompt generation respects the active persisted fret range.
- Fretboard rendering places fret `0` on the nut/left edge while frets `1...12` occupy the visible fret spaces.
- Unit tests cover note mapping, quiz evaluation, and stats persistence/backward-compatible stats decoding.
- UI tests cover wrong-answer retry, no manual next button, correct-answer auto-advance, settings access, and confirm chromatic settings are not shown on the practice page.

## Quality Bar
- The app launches on iPhone with no network connection.
- Existing note-finder behavior remains stable unless the roadmap item explicitly changes it.
- Prompt generation respects the selected note set and active fret range.
- Persisted stats and settings survive app relaunch.
- UI remains usable on phone-sized portrait screens.
- Unit tests cover core note, prompt, stats, and persistence behavior.
- UI smoke coverage protects the main practice flow and any new navigation path.

## Near-Term Roadmap
- Add timing for each prompt so the app can measure how long it takes the user to select the correct note, including persistence for summary timing stats.
- Add guitar-style fret marker dots at frets `3`, `5`, `7`, and `9` in `FretboardView` so the active question note is easier to locate by row at a glance.
- Add an initial home screen that lets the user choose a practice mode before entering a drill. For the first version, expose only the existing note-finder drill as the available mode and keep the current note-finder screen behavior unchanged after selection.
- Move the existing note-finder drill behind the new home-screen entry point, including navigation back to mode selection, launch behavior that starts on the home screen, and UI smoke coverage for selecting the note-finder mode.

## Later Roadmap
- Add a display-mode option that randomly switches between sharp spellings and flat spellings after every few questions once chromatic notes are enabled.
- Add an adaptive practice algorithm that uses recent misses and failed frets to increase the probability of seeing weak positions without fully eliminating normal random review.
- Add a placeholder-ready mode model for future drill types so the home screen can represent unavailable modes without implementing their drill logic yet.
- Add a chord detector mode where the app shows a chord shape or fretboard positions and asks the user to identify the chord.
- Add a chord builder mode where the app gives a chord name and asks the user to place or choose the notes/shape that build it.
- Add a chord progression trainer mode for practicing common progressions and recognizing functional movement between chords.
- Add an inverse note detector mode where the app gives a note name and the user taps a matching fretboard location.

## Next Agent Task
Add timing for each prompt so the app can measure how long it takes the user to select the correct note, including persistence for summary timing stats.
