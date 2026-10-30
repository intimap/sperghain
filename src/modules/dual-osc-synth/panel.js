import { element } from '../../ui/dom.js';
import { knob } from '../../ui/knob.js';
import { parameterInput } from '../../ui/parameter-input.js';
import { definition } from './definition.js';

export function controls(instance, store) {
  const box = element('div', 'dual-osc-controls');
  const waveforms = element('div', 'dual-osc-waveforms');
  for (const id of ['waveform1', 'waveform2']) {
    const spec = definition.parameters[id];
    waveforms.append(parameterInput(spec, instance.parameters[id], value => {
      store.parameter(instance.id, id, value);
    }));
  }
  const sliders = element('div', 'dual-osc-sliders');
  for (const id of ['mix', 'attack', 'decay', 'sustain', 'release']) {
    sliders.append(knob(definition.parameters[id], instance.parameters[id], value => {
      store.parameter(instance.id, id, value);
    }));
  }
  box.append(waveforms, sliders,
    element('p', 'dual-osc-hint', 'MIX: OSC 1 ← → OSC 2 · 0V = C3 · UNPATCHED GATE = ON'));
  return box;
}
