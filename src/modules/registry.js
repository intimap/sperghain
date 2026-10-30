import { definition as oscillator } from './oscillator/definition.js';
import { Oscillator } from './oscillator/processor.js';
import { definition as output } from './output/definition.js';
import { Output } from './output/processor.js';
import { definition as clock } from './clock/definition.js';
import { Clock } from './clock/processor.js';
import { definition as sequencer } from './sequencer/definition.js';
import { Sequencer } from './sequencer/processor.js';
import { definition as dualOscSynth } from './dual-osc-synth/definition.js';
import { DualOscSynth } from './dual-osc-synth/processor.js';
export const registry = new Map([
  [oscillator.type, { definition: oscillator, Processor: Oscillator }],
  [output.type, { definition: output, Processor: Output }],
  [clock.type, { definition: clock, Processor: Clock }],
  [sequencer.type, { definition: sequencer, Processor: Sequencer }],
  [dualOscSynth.type, { definition: dualOscSynth, Processor: DualOscSynth }]
]);
export function definition(type) {
  const module = registry.get(type);
  if (!module) throw new Error(`Unknown module: ${type}`);
  return module.definition;
}
