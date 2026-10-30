import { element, button } from '../../ui/dom.js';
import { parameterInput } from '../../ui/parameter-input.js';
import { definition } from './definition.js';
export function controls(instance, store) {
  const box = element('div', 'clock-controls');
  const tempo = parameterInput(definition.parameters.bpm, instance.parameters.bpm,
    value => store.parameter(instance.id, 'bpm', value));
  const display = element('div', 'transport-display', 'STOPPED'); display.dataset.status = 'clock';
  const run = button(instance.parameters.running ? '■ Stop' : '▶ Start', 'Start or stop clock', () => {
    const current = store.patch.modules.find(module => module.id === instance.id);
    const next = current.parameters.running ? 0 : 1;
    store.parameter(instance.id, 'running', next);
    run.textContent = next ? '■ Stop' : '▶ Start';
    run.setAttribute('aria-pressed', String(!!next));
  });
  run.setAttribute('aria-pressed', String(!!instance.parameters.running));
  const reset = button('↶ Reset', 'Reset clock and sequencers', () => {
    const current = store.patch.modules.find(module => module.id === instance.id);
    store.parameter(instance.id, 'reset', (current.parameters.reset + 1) % 65536);
  });
  const transport = element('div', 'transport-buttons'); transport.append(run, reset);
  box.append(tempo, display, transport, element('p', 'module-hint', 'Patch CLOCK + RUN + RESET to every sequencer.'));
  return box;
}
