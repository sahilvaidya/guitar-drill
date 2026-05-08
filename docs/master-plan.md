# Fretboard Trainer Master Plan

## Product Brief
Fretboard Trainer is a native iPhone app for memorizing guitar notes on the fretboard without an internet connection. The shipped loop is intentionally narrow: show one dot on a standard-tuned six-string fretboard covering frets `0...12`, let the user answer from note buttons, and show immediate correct/incorrect feedback. Natural-note practice is the default, with an optional chromatic mode that includes sharp/flat answer choices.

The app is portrait-first, phone-sized, fully offline, and local-only. There is no backend, no sync, no login, and no audio input in v1.

## Stack Decision
- Platform: native iOS app
- UI: `SwiftUI`
- Language: `Swift`
- State model: `@Observable` objects with SwiftUI bindings
- Persistence: `UserDefaults` for lightweight local summary stats and future settings
- Testing: `XCTest` unit tests plus one `XCUITest` drill-flow smoke test

### Why Native iOS
- The app is for one device family: iPhone.
- The app must work offline with no degraded experience.
- SwiftUI keeps the UI lightweight while still feeling native on touch screens.
- Native iOS keeps the dependency surface small for later agents.

## Architecture Overview
- `NoteName`: natural and chromatic answer choices, including combined accidental labels such as `C#/Db`
- `NotePracticeMode`: selectable natural-only or chromatic practice mode
- `GuitarString`: standard tuning string definitions and open-string pitch classes
- `FretPosition`: string + fret with computed pitch class plus natural/chromatic note lookup
- `QuizPrompt`: the displayed fretboard position and correct answer
- `QuizEngine`: prompt generation and answer evaluation
- `StatsStore`: on-device persistence for lifetime stats and lightweight settings
- `PracticeSession`: observable session state for the active drill loop
- `FretboardView`: SwiftUI fretboard renderer and dot placement

## Ordered Phases

### Phase 1: Project Bootstrap
- Create a native SwiftUI iPhone project.
- Keep deployment target modern enough for `Observation` and current Xcode support.
- Check in the canonical roadmap in this file before parallel implementation work grows.

### Phase 2: Core Drill Loop
- Render a standard six-string fretboard over frets `0...12`.
- Generate prompts for natural-note positions by default, with selectable chromatic prompts for all pitch classes.
- Show one dot at a time.
- Present note-name answer buttons.
- Show incorrect feedback without advancing when the user picks the wrong note.
- Keep the same prompt active until the user selects the correct note.
- After a correct answer, show feedback briefly and automatically advance to the next prompt without a manual next button.

### Phase 3: Local Progress Tracking
- Track session attempts, correct answers, and current streak.
- Persist lifetime totals and best streak on-device.
- Keep persistence local and lightweight.

### Phase 4: Quality Gates
- Add unit tests for note mapping and quiz evaluation.
- Add at least one UI test that launches the app, answers a prompt, and verifies feedback.
- Keep the app usable with no network access.

## Acceptance Criteria

### Core Product
- The app launches on iPhone with no network connection.
- The fretboard shows six strings and frets `0...12`.
- The active prompt is represented by a visible dot on one position.
- The answer area shows note buttons for `A`, `B`, `C`, `D`, `E`, `F`, and `G` in natural mode.
- Chromatic mode adds combined accidental answer choices such as `A#/Bb`, `C#/Db`, `D#/Eb`, `F#/Gb`, and `G#/Ab`.
- Wrong answers show immediate incorrect feedback and keep the current prompt active.
- The user can keep trying answers until selecting the correct note.
- Correct answers show brief success feedback, then the app automatically advances to the next prompt after a short delay.
- The drill flow does not require a manual next button.

### Data And Logic
- Prompt generation excludes non-natural notes in natural mode and includes all fret positions in chromatic mode.
- Standard tuning is fixed in v1.
- Lifetime totals survive app relaunch because they are persisted locally.
- The selected note practice mode survives app relaunch because it is persisted locally.

### Tests
- Unit tests cover fret-to-note mapping and quiz answer evaluation.
- UI smoke coverage verifies launch, answer selection, and feedback rendering.
- UI coverage verifies wrong answers do not advance, correct answers auto-advance, and no manual next button is required.
- Unit and UI coverage verify chromatic answer choices and accidental note mapping.

## Non-Goals
- Alternate tunings
- Full-neck practice beyond the 12th fret
- Game timers, combo systems, or spaced repetition in v1
- Backend services, sync, accounts, or audio recognition

## Completed Features
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

## High-Priority Roadmap
- Add timing for each prompt so the app can measure how long it takes the user to select the correct note, including persistence for summary timing stats.

## Lower-Priority Roadmap
- Add a display-mode option that randomly switches between sharp spellings and flat spellings after every few questions once chromatic notes are enabled.
- Add an adaptive practice algorithm that uses recent misses and failed frets to increase the probability of seeing weak positions without fully eliminating normal random review.

## Next Agent Task
Add timing for each prompt so the app can measure how long it takes the user to select the correct note, including persistence for summary timing stats.
