import { definition } from '../modules/registry.js';
import { element, button } from '../ui/dom.js';
import { modulePanels } from '../modules/panels.js';
import { knob } from '../ui/knob.js';
export function panel(instance, store, onPort) {
  const spec = definition(instance.type);
  const root = element('article', `module ${spec.accent}`); root.style.width = `${spec.width}px`;
  root.dataset.module = instance.id;
  root.setAttribute('aria-label', spec.name);
  const tools = element('div', 'module-tools');
  tools.append(element('span', 'screw', '+'), button('←', `Move ${spec.name} left`, () => store.move(instance.id, -1)), button('→', `Move ${spec.name} right`, () => store.move(instance.id, 1)), button('×', `Remove ${spec.name}`, () => store.remove(instance.id)));
  root.append(tools, element('div', 'module-category', spec.category), element('h2', '', spec.short), element('div', 'module-subtitle', spec.name));
  const motif = element('div', 'module-motif', spec.type === 'oscillator' ? '∿' : '▂ ▄ ▆ █'); motif.setAttribute('aria-hidden', 'true'); root.append(motif);
  const customControls = modulePanels.get(spec.type);
  if (customControls) { motif.remove(); root.append(customControls(instance, store)); }
  else for (const [id, param] of Object.entries(spec.parameters)) root.append(knob(param, instance.parameters[id], value => store.parameter(instance.id, id, value)));
  const ports = element('div', 'ports');
  for (const port of spec.ports) {
    const wrap = element('div', 'port-wrap');
    const socket = button('', `${spec.name} ${port.label} ${port.direction}`, () => onPort(instance.id, port));
    socket.className = `socket ${port.signal}`; socket.dataset.module = instance.id; socket.dataset.port = port.id;
    socket.dataset.direction = port.direction;
    wrap.append(socket, element('span', '', `${port.direction === 'output' ? '↗ ' : '↘ '}${port.label}`)); ports.append(wrap);
  }
  const foot = element('div', 'module-foot'); foot.append(element('span', 'screw', '+'), element('span', '', 'SPERGHAIN'), element('span', 'screw', '+'));
  root.append(ports, foot); return root;
}
