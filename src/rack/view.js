import { panel } from './panel.js';
import { drawCables } from '../patching/cables.js';
export function mountRack(store, report) {
  const rack = document.querySelector('#rack'), modules = document.querySelector('#modules'), svg = document.querySelector('#cables');
  let pending = null;
  function clearPending() { pending = null; rack.querySelectorAll('.pending').forEach(node => node.classList.remove('pending')); }
  function onPort(module, port) {
    if (port.direction === 'output') {
      clearPending(); pending = { module, port: port.id };
      [...rack.querySelectorAll('.socket')].find(node => node.dataset.module === module && node.dataset.port === port.id).classList.add('pending');
      report('Now click an input. Press Escape to cancel.'); return;
    }
    if (!pending) { report('Click an output socket first, then an input.'); return; }
    try { store.connect(pending, { module, port: port.id }); clearPending(); report('Connected. Your signal has somewhere to go.'); }
    catch (error) { report(error.message); }
  }
  const draw = () => drawCables(svg, rack, store.patch, id => { store.disconnect(id); report('Cable unplugged.'); });
  function render(patch, kind) {
    if (kind === 'parameter') return;
    clearPending();
    modules.replaceChildren(...patch.modules.map(instance => panel(instance, store, onPort)));
    document.querySelector('#empty').hidden = patch.modules.length > 0;
    document.querySelector('#count').textContent = `/ ${String(patch.modules.length).padStart(2, '0')} MODULES`;
    document.querySelector('#cable-count').textContent = `${patch.cables.length} CONNECTIONS`;
    rack.style.minWidth = `${Math.max(720, patch.modules.reduce((width, module) => width + modules.querySelector(`[data-module="${module.id}"]`).offsetWidth + 12, 60))}px`;
    requestAnimationFrame(draw);
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape') clearPending(); });
  new ResizeObserver(draw).observe(rack);
  store.subscribe(render); render(store.patch);
}
