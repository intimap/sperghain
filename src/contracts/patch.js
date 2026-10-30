/**
 * Patch v1: { version: 1, modules: ModuleInstance[], cables: Cable[] }
 * ModuleInstance: { id: string, type: string, version: 1, parameters: Record<string, number> }
 * Array order is rack placement. Runtime phase/envelope state is not persisted.
 * Cable: { id: string, from: { module, port }, to: { module, port } }
 * Audio and CV use Float32 voltage buffers. Nominal audio is ±5V.
 * Pitch: +1V doubles the base frequency; 0V leaves the frequency knob unchanged.
 * One cable per input; output fan-out supported. No cycles in v1.
 * Processors expose process(inputs, outputs, parameters, frames, sink).
 * MIDI will use sample-offset events through a separate contract in a later version.
 */
export const PATCH_VERSION = 1;
export const MAX_MODULES = 32;
export function emptyPatch() { return { version: PATCH_VERSION, modules: [], cables: [] }; }
