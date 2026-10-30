# DualOscSynth

A two-oscillator mono voice with a built-in amplitude ADSR. Its processor is registered in the same DSP registry used by the sine oscillator and runs in the existing rack AudioWorklet. No new dependencies or changes to other module implementations.

## First patch

1. Add DualOscSynth and Stereo output to the empty rack.
2. Connect AUDIO OUT to AUDIO IN, then enable audio.
3. With GATE unpatched, its default 5V starts attack/decay and holds sustain so the voice is audible.
4. For notes, patch Step sequencer GATE to DualOscSynth GATE, and PITCH CV to 1V/OCT. Drive the sequencer with Master clock as usual. A patched low gate is silent initially and releases an existing note.
5. Alternatively, Load patch with `examples/dual-osc-sequence.json`, enable audio, and press Start on the clock.

## Controls and conventions

| Parameter | Default | Range / meaning |
| --- | --- | --- |
| Osc 1 waveform | Saw | enum 0 = sine, 1 = saw, 2 = square |
| Osc 2 waveform | Square | same enum |
| Mix | 0.5 | 0 = Osc 1 only, 1 = Osc 2 only, linear crossfade |
| Attack | 0.01 seconds | 0.001–2 seconds |
| Decay | 0.15 seconds | 0.001–2 seconds |
| Sustain | 0.7 | 0–1 amplitude |
| Release | 0.3 seconds | 0.001–4 seconds |

Pitch is fixed at C3 = 130.81Hz without CV. The 1V/oct reference is **0V = C3**: +1V = 261.62Hz and -1V = 65.405Hz. A patched voltage becomes the pitch source for both oscillators. No extra frequency/tuning knob is introduced. Phase accumulators are independent, initially aligned, and free-running; they do not reset on gates. CV is limited to ±10V and target frequency to 45% of the sample rate, matching the existing oscillator's safety convention.

GATE uses the existing 1V threshold. A rising edge enters attack from the current envelope level. A falling edge releases from the current level. Sustained high never repeatedly retriggers. Release retriggers and rapid pulses avoid a hard level reset. With steady parameters, attack/decay/release are linear segments of the configured duration. Times and sustain track parameter edits smoothly; runtime phase and envelope progress are not saved, as with existing module processors.

The continuous controls use the existing knob/slider component, including keyboard arrows and double-click reset. Time parameters are stored in seconds and displayed in ms below one second. The shared formatter's existing Hz/percent behaviour is unchanged. Waveform selectors use the existing numeric enum controls and JSON validation; patch type ID is `dual-osc-synth`, class/display name is `DualOscSynth`, version is 1.

Mix, final CV-derived frequency, and all ADSR controls use the existing 10ms one-pole smoothing coefficient. Discrete waveform changes also crossfade over approximately 10ms. Audio is nominally bounded to ±5V at peak envelope, consistent with the output module's voltage scaling. The render loop reuses state/buffers without per-sample allocation.

## Limits

Saw and square are naïve, not band-limited, and may alias at high pitches. `waveforms.js` contains a TODO for a future band-limited implementation. No filter is included in this request: the module provides the oscillator mix and amplitude envelope for later subtractive processing. Rack limits, one-cable-per-input and feedback rejection remain owned by the existing infrastructure.

## Automated verification

Tests measure C3 and octave offsets at 44.1/48kHz, ADSR timing/holding/release, retrigger continuity, waveform differences, mix endpoints, parameter smoothing, block-boundary invariance, graph output, sequencer gates, JSON round trips, invalid values and existing rack safety limits. All existing tests are also run.
