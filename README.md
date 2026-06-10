# Guitar Drill

A fretboard trainer for guitar players, built for iPhone. Fully offline — no
account, no network, no backend. Drill note names until they're automatic,
then use the study references to connect them into chords and scales.

Built with Expo / React Native / TypeScript. See [`roadmap.md`](roadmap.md)
for product direction and what's coming next — this feature list is updated
as roadmap items are completed.

## Features

### Practice

- **Note Identification — Training**: a fretboard position is highlighted;
  name the note. Immediate feedback, retry on a miss, auto-advance on a hit.
  An adaptive engine weights recently-missed positions 5× so your weak spots
  come up more often.
- **Note Identification — Speed Game**: the same drill under time pressure.
  Three answer choices, wrong taps cost 6 seconds, and when your rolling
  5-prompt average response time crosses 5 seconds it's game over. A live
  stock-style chart tracks your times against the red line; best score is
  saved.
- **Inverse Note Finder**: the reverse drill — given a note name, tap a fret
  position that plays it.
- **Chord Detector**: an interactive tool — tap out any shape on the
  fretboard (one note per string, open strings included) and it names the
  chord live. Recognizes major, minor, dim, dim7, 7, maj7, m7, sus2 and sus4,
  including shell voicings (omitted 5th) and slash chords (C/E, D/F#) when
  the bass isn't the root.

### Ear Training

- **Interval Training**: hear two plucked notes and name the interval — from
  minor 2nd to octave. Ascending, descending, harmonic, or mixed playback;
  three difficulty levels (5, 9, or all 12 intervals); replay anytime. Each
  correct answer shows a classic reference melody (Star Wars for a perfect
  5th, Here Comes the Bride for a perfect 4th, …). Tones are synthesized
  on-device with a Karplus-Strong plucked-string model, so it works fully
  offline with no bundled samples. Note Identification, Chord Identification,
  and Melodic Dictation are next up on the roadmap.

### Study

- **Chord Shapes library**: classic chord charts for the open-position
  staples, open 7th chords, sus chords, E-family and A-family barre shapes
  (major, minor, 7, m7, maj7), and power chords. A root-note picker
  transposes every moveable shape to any key with real fret numbers.
- **Triads**: theory and all closed-position voicings (root position, 1st
  and 2nd inversion) for major, minor, diminished, and augmented triads on
  the top three strings.
- **CAGED System**: the five pentatonic boxes and five full scale positions
  up the neck, with a Major/Minor toggle that relabels every scale degree
  for the relative key — plus harmonized two-string thirds and sixths runs.

### Settings & Stats

- Natural-notes or full chromatic mode (prompts alternate sharp/flat
  spellings so you learn both)
- Configurable fret range (0–12) respected by every drill
- Session and lifetime stats, response timing, recent misses — all persisted
  locally on device

## Development

```bash
npm install
npx expo start                                  # dev server (press i for iOS Simulator)
npm test                                        # run unit tests
eas build --platform ios --profile production   # cloud build
eas update --branch production --message "..."  # OTA update (JS-only changes)
```

The codebase keeps music theory as pure TypeScript in `src/domain/` (no
React Native imports), services and stores on top, and screens in `app/`
via Expo Router. Every chord voicing and scale shape in the study sections
is verified by unit tests against the domain logic.

## License

See [LICENSE](LICENSE).
