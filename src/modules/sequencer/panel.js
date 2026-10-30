import { element, button } from '../../ui/dom.js';
import { parameterInput } from '../../ui/parameter-input.js';
import { definition } from './definition.js';
export function controls(instance, store) {
  const box = element('div', 'sequencer-controls');
  const settings = element('div', 'sequence-settings');
  const cells = [];
  const updateLength = length => cells.forEach((cell, index) => {
    cell.classList.toggle('outside-loop', index >= length);
    cell.title = index >= length ? 'Outside current loop' : `Step ${index + 1}`;
  });
  for (const id of ['division', 'length', 'gateWidth']) {
    settings.append(parameterInput(definition.parameters[id], instance.parameters[id], value => {
      store.parameter(instance.id, id, value);
      if (id === 'length') updateLength(value);
    }));
  }
  const steps = element('div', 'sequence-steps');
  for (let index = 0; index < 8; index++) {
    const cell = element('div', 'sequence-step'); cell.dataset.step = index;
    const gateKey = `gate${index}`, pitchKey = `pitch${index}`;
    const gate = button(String(index + 1).padStart(2, '0'), `Step ${index + 1} gate`, () => {
      const current = store.patch.modules.find(module => module.id === instance.id);
      const next = current.parameters[gateKey] ? 0 : 1;
      store.parameter(instance.id, gateKey, next);
      gate.setAttribute('aria-pressed', String(!!next));
    });
    gate.setAttribute('aria-pressed', String(!!instance.parameters[gateKey]));
    const pitch = parameterInput({ ...definition.parameters[pitchKey], label: `Step ${index + 1} pitch` },
      instance.parameters[pitchKey], value => store.parameter(instance.id, pitchKey, value));
    cell.append(gate, pitch); cells.push(cell); steps.append(cell);
  }
  const status = element('div', 'sequence-status', 'WAITING FOR CLOCK'); status.dataset.status = 'sequencer';
  box.append(settings, steps, status);
  updateLength(instance.parameters.length);
  return box;
}
