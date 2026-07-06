# ChordWarrior

A chord training app for sight-reading, ear-training, and chord recognition. It generates chord
progressions (from a curated library or an algorithmic functional-harmony engine), displays them
as sheet music, chord symbols, or Roman numerals, and grades what you actually play back via MIDI
and/or your microphone.

This is a pnpm workspace with three packages:

- **`packages/harmonic-engine`** — the music-theory core (notes, chords, scales, progressions, voice leading). Shared by both apps below.
- **`app`** — the main app: a React/Vite web app, wrapped in Tauri for a native desktop build (Windows `.exe`, Linux `.AppImage`).
- **`mobile`** — an Expo/React Native scaffold. It shares the harmonic engine but does **not** yet support MIDI input, microphone pitch detection, or staff rendering (see [Mobile](#mobile-expo) below).

## Prerequisites

| Tool | Needed for | Notes |
|---|---|---|
| [Node.js](https://nodejs.org/) 20+ | everything | |
| [pnpm](https://pnpm.io/) | everything | This repo uses pnpm workspaces (`workspace:*` deps) — npm/yarn won't resolve it |
| [Rust + Cargo](https://www.rust-lang.org/tools/install) | desktop build only | Needed to compile the Tauri desktop wrapper |
| System WebView libraries | desktop build only | Linux: `webkit2gtk`/GTK dev packages (see below). Windows/macOS: nothing extra — Tauri uses the OS's built-in WebView |

## Install

```bash
git clone https://github.com/SpeeNotPee/Chord-Warrior.git
cd Chord-Warrior
pnpm install
```

This installs dependencies for all three packages at once.

## Run the web app

```bash
cd app
pnpm dev
```

Opens a dev server (prints the URL, typically `http://localhost:5173`). This is the full app —
MIDI input, microphone pitch detection, sheet music rendering, and audio playback all work here.

To build a static production bundle instead:

```bash
pnpm build      # outputs to app/dist
pnpm preview    # serve the production build locally
```

## Build the desktop app

The desktop build wraps the same web app in [Tauri](https://tauri.app) for a native, lightweight
installer with no admin rights required.

```bash
cd app
pnpm exec tauri dev      # run it as a desktop window during development
```

**Linux (AppImage):**

```bash
cd app
pnpm run tauri:build:appimage
```

Output: `app/src-tauri/target/release/bundle/appimage/ChordWarrior_<version>_amd64.AppImage`
— a single executable file, just `chmod +x` it and run it, no installation needed.

First-time setup on Linux — install the WebView dependencies. On Arch:

```bash
sudo pacman -S --needed webkit2gtk-4.1
```

(On Debian/Ubuntu it's `libwebkit2gtk-4.1-dev` and friends — see the
[Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/) for your distro.)

> The `tauri:build:appimage` script (rather than plain `tauri build`) works around two bundler
> quirks on newer Linux systems (a stale `strip` tool and a `gdk-pixbuf` loader-path mismatch on
> rolling-release distros like Arch). If you're on Debian/Ubuntu/Fedora, plain
> `pnpm exec tauri build --bundles appimage` will likely work fine too — try the plain command
> first and fall back to the `tauri:build:appimage` script if it fails with a `strip` or
> `gdk-pixbuf` error.

**Windows (.exe/.msi):**

```powershell
cd app
pnpm exec tauri build
```

No extra setup needed — Windows already has WebView2 built in. Output lands in
`app\src-tauri\target\release\bundle\`.

## Mobile (Expo)

```bash
cd mobile
pnpm start
```

This is a scaffold, not the full app: it demos the shared harmonic engine (browse the progression
library, see chord symbols/Roman numerals) but has no sheet-music rendering, MIDI input, or
microphone pitch detection yet.

## Using the app

**1. Pick a progression source** (left panel):
- **Library** — a curated Baroque/Jazz/Pop progression (cadences, ii-V-I, secondary dominants, tritone subs, four-chord pop loops, etc.)
- **Algorithmic** — a progression generated on the fly from a Markov-chain model of functional harmony, in whatever key/length you choose

**2. Set Key & Mode** — root note and scale quality (Major, Natural Minor, Harmonic Minor).

**3. Set Complexity Tier** — Tier 1 (triads), Tier 2 (7th chords), Tier 3 (extended/altered chords like add9, 9ths, altered dominants).

**4. Click "Generate New Progression"** to build a new sequence with the current settings.

**5. Pick an Interaction Mode** (top tabs):
- **Sheet Music** — the current chord on a staff; switch clef (Treble/Bass/Alto/Tenor) to see the same pitches reposition
- **Chord Notation** — the chord as a plain symbol (e.g. `CΔ7`) or a Roman numeral (e.g. `ii7`)
- **Listening** — the chord is hidden; press "Replay Chord" (or wait for it to auto-play) to hear it and identify it by ear

**6. Turn on Input** — click **Start** next to MIDI and/or Microphone. Your browser/OS will prompt
for permission the first time. Play the notes shown; the panel at the bottom shows which pitches
were detected and whether they matched.

**7. Grading Strictness:**
- **Loose** — correct if you play the right pitch classes in any octave/inversion
- **Strict** — correct only if you match the exact notes and layout shown on the staff

Getting a chord right advances to the next one automatically; you can also navigate manually with
**← Prev / Next →**.

## Tests

```bash
cd packages/harmonic-engine && pnpm exec vitest run   # music theory logic
cd app && pnpm exec vitest run                         # pitch detection, grading, MIDI mapping
```
