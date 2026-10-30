import { registry } from '../modules/registry.js';
import { element, button } from './dom.js';
export function mountBrowser(store, report) {
  const dialog = document.querySelector('#browser');
  const list = document.querySelector('#module-list');
  const errorNotice = element('p', 'library-note');
  errorNotice.setAttribute('role', 'alert');
  dialog.append(errorNotice);
  for (const { definition: spec } of registry.values()) {
    const card = element('article', `library-card ${spec.accent}`);
    const symbol = element('div', 'library-symbol', spec.symbol || (spec.type === 'oscillator' ? '∿' : '▥'));
    const copy = element('div'); copy.append(element('div', 'eyebrow', spec.category), element('h3', '', spec.name), element('p', '', spec.description));
    card.append(symbol, copy, button('+ Add', `Add ${spec.name}`, () => {
      try { store.add(spec.type); dialog.close(); report(`${spec.name} added to the rack.`); }
      catch (error) { errorNotice.textContent = error.message; }
    })); list.append(card);
  }
  dialog.querySelector('.library-note').textContent = `MODULE COLLECTION · ${registry.size} MODULES`;
  for (const id of ['add', 'empty-add']) document.getElementById(id).onclick = () => dialog.showModal();
  document.querySelector('#close-browser').onclick = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
}
