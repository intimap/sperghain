import { newId } from '../contracts/id.js';
import { emptyPatch, MAX_MODULES } from '../contracts/patch.js';
import { definition } from '../modules/registry.js';
import { validatePatch } from '../patches/validate.js';
export class RackStore {
  constructor() { this.patch = emptyPatch(); this.listeners = new Set(); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(kind = 'graph') { for (const listener of this.listeners) listener(this.patch, kind); }
  add(type) {
    if (this.patch.modules.length >= MAX_MODULES) throw new Error('Rack limit: 32 modules.');
    const spec = definition(type);
    const module = { id: newId(), type, version: spec.version, parameters: Object.fromEntries(Object.entries(spec.parameters).map(([id, p]) => [id, p.default])) };
    this.patch.modules.push(module); this.emit();
  }
  remove(id) {
    this.patch.modules = this.patch.modules.filter(module => module.id !== id);
    this.patch.cables = this.patch.cables.filter(cable => cable.from.module !== id && cable.to.module !== id);
    this.emit();
  }
  move(id, offset) {
    const modules = this.patch.modules;
    const index = modules.findIndex(module => module.id === id);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= modules.length) return;
    [modules[index], modules[target]] = [modules[target], modules[index]];
    this.emit('layout');
  }
  parameter(id, key, value) {
    const instance = this.patch.modules.find(module => module.id === id);
    const spec = definition(instance.type).parameters[key];
    if (!spec || !Number.isFinite(value)) throw new Error('Invalid parameter.');
    instance.parameters[key] = Math.max(spec.min, Math.min(spec.max, value));
    this.emit('parameter');
  }
  connect(from, to) {
    const patch = { ...this.patch, cables: [...this.patch.cables, { id: newId(), from, to }] };
    this.patch = validatePatch(patch); this.emit();
  }
  disconnect(id) { this.patch.cables = this.patch.cables.filter(c => c.id !== id); this.emit(); }
  load(patch) { this.patch = validatePatch(patch); this.emit(); }
}
