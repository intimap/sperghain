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

Develop and test features on branches. Open a pull request and share its Netlify Deploy Preview link so the user can test in their browser without local installation. Merge into `main` only after user approval.

Netlify builds are active for previews. The live production deploy is locked against automatic publishing. `scripts/netlify-ignore.mjs` also skips ordinary production-context builds while allowing `deploy-preview` and `branch-deploy` builds. Branch deploys remain disabled unless deliberately enabled; PR previews are the normal review path.

Merging approved code into `main` does not publish it. Publish production only on an explicit user request; release manually from the approved build, or deliberately unlock/trigger a release and restore the publishing lock afterwards. Netlify build hooks can bypass ignore rules, so retain the production lock and do not add release hooks without authorization.

Local `npm run dev` remains available for development, but the user does not need it for routine review. Existing preview links retain their last deployment after their PR is merged; a new feature gets a new PR preview link.

## Current boundaries

32 modules maximum; oscillator, DualOscSynth, output, master clock and eight-step sequencer. No MIDI, filter, polyphony, drag placement, undo, autosave, external modules or native plugin yet. Reorder with arrows. The dial is a visual indicator controlled by its slider. Graph edits may click; parameter changes and master gain are smoothed. Graph compilation allocates on the worklet message handler, so large live edits are not yet guaranteed glitch-free.

Architecture: [docs/architecture.md](docs/architecture.md). Contributor rules: [AGENTS.md](AGENTS.md).

Review: [verification notes](docs/verification.md) and [rack screenshot](docs/foundation-preview.jpg).

## Clock and sequencing

See [clock/sequencer guide](docs/clock-sequencer.md) for wiring, timing conventions and limits. Load [the example patch](examples/clock-sequence.json), enable audio, then press Start on the clock.

## Dual oscillator voice

[DualOscSynth guide](docs/dual-osc-synth.md): two selectable oscillators and an amplitude ADSR, with gate and 1V/oct inputs. Load [the example patch](examples/dual-osc-sequence.json) for a clocked sequence.
