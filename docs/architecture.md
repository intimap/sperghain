# Architecture and roadmap

The browser host, rack interface and DSP engine are separate ES module boundaries. There are no runtime dependencies.

- `app/`: composition only.
- `contracts/`: versioned patch and processor conventions.
- `modules/<type>/`: declarative definition and host-independent DSP processor.
- `modules/registry.js`: single registration point; no module-to-module imports.
- `engine/`: compile connections into a topological processing order and reused sample buffers.
- `platform/`: AudioContext/AudioWorklet adapters, master gain and audio lifecycle.
- `rack/`: model mutations, placement order and panels.
- `patching/`: graph validation and cable view.
- `patches/`: boundary validation and browser JSON import/export.
- `ui/`: shared controls, module library and visual style.

The engine runs at the host sample rate. A processor accepts named input/output buffers, parameters, a frame count and a sink. Audio is nominal ±5V; output converts 5V to full scale before level/master gain. One volt of pitch CV doubles the oscillator's base frequency. Unconnected inputs are zero. Multiple output modules sum; the host clamps summed output to [-1,1]. This is a simple clip guard, not a mastering limiter.

Graph compilation occurs only for structural edits. The per-block render function does not allocate. Existing module processors survive repatching/reordering. Parameters update without rebuilding the graph. UI draws do not determine musical timing. The current worklet supports render quanta up to 2048 frames, returning silence for larger quanta.

## Adding a module

1. Add definition.js with stable type/port/parameter IDs and a version.
2. Add processor.js implementing the DSP contract.
3. Register both in modules/registry.js.
4. Add meaningful DSP tests. The standard panel renders ports and numeric parameters automatically.
5. Extend the panel system only for genuinely custom displays or controls.

## Next milestones

1. LFO, attenuator, mixer and scope; meter actual signals.
2. Sample-offset MIDI event contract and MIDI-to-CV bridge; envelope, VCA and filter.
3. Patch migrations, undo/redo, drag/snapped rack placement and safer graph crossfades.
4. Sequencer and effects; explicit delay-based feedback support.
5. Evaluate portable native/WASM DSP before a substantial module catalogue. A C++/Rust implementation could share algorithms between browser and native plugin hosts; current JS processors will need porting. Contracts, tests, assets and patch schema remain useful. No promise of a zero-rewrite Ableton plugin.

## Verification

Unit tests cover tone pitch/amplitude, sample-rate independence, CV pitch, output routing, independent instances, cycle rejection, fan-out, patch validation and removal. Browser QA must verify the live AudioWorklet and UI; unit tests alone do not establish audible glitch-free operation.
