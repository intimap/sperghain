# Sperghain

A pixel-art modular synthesizer for the browser. Fresh sessions open with an empty rack.

## Run

Node 22 or later. No runtime dependencies or installation required.

```sh
npm run dev
npm test
npm run check
npm run build
```

Open the local URL printed by the development server (port 5173). Audio requires localhost or HTTPS.

## First patch

1. Add a Sine oscillator and Stereo output from the module library.
2. Click the oscillator's SINE socket, then the output's AUDIO IN socket.
3. Enable audio. Adjust frequency with the slider below the dial (keyboard arrows work too).
4. Adjust output level/master, or mute. Double-click a parameter slider to reset it.
5. Click a cable to unplug it. Use module arrows to reorder or × to remove.
6. Save a JSON patch; Load restores module order, controls and cables. Loading replaces the current rack.

Multiple oscillators may be instantiated. Patch one oscillator to another's 1V/OCT input for audio-rate pitch modulation. One cable per input. Feedback cycles are rejected. An output duplicates its mono input to stereo.

## Branch and release workflow

All implementation lives on feature branches until user approval. Do not merge or deploy production without approval.
The repository started empty: the initial feature branch is the only branch until an approved main baseline exists.
Once Netlify is connected, use `main` as production and feature branches for previews. A PR preview needs an existing base branch. Netlify configuration is included; no deployment has been made.

## Current boundaries

32 modules maximum; sine oscillator and output only. No MIDI, sequencer, filter, polyphony, drag placement, undo, autosave, external modules or native plugin yet. Reorder with arrows. The dial is a visual indicator controlled by its slider. Graph edits may click; parameter changes and master gain are smoothed. Graph compilation allocates on the worklet message handler, so large live edits are not yet guaranteed glitch-free.

Architecture: [docs/architecture.md](docs/architecture.md). Contributor rules: [AGENTS.md](AGENTS.md).

Review: [verification notes](docs/verification.md) and [rack screenshot](docs/foundation-preview.jpg).
