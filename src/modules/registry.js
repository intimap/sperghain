import { definition as oscillator } from './oscillator/definition.js';
import { Oscillator } from './oscillator/processor.js';
import { definition as output } from './output/definition.js';
import { Output } from './output/processor.js';
export const registry = new Map([
  [oscillator.type, { definition: oscillator, Processor: Oscillator }],
  [output.type, { definition: output, Processor: Output }]
]);
export function definition(type) {
  const module = registry.get(type);
  if (!module) throw new Error(`Unknown module: ${type}`);
  return module.definition;
}
