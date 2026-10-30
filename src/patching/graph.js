import { definition } from '../modules/registry.js';
export function getPort(patch, endpoint, direction) {
  const instance = patch.modules.find(module => module.id === endpoint?.module);
  if (!instance) throw new Error('Cable references a missing module.');
  const port = definition(instance.type).ports.find(port => port.id === endpoint.port && port.direction === direction);
  if (!port) throw new Error(`Invalid ${direction} port.`);
  return port;
}
export function processingOrder(patch) {
  const incoming = new Map(patch.modules.map(module => [module.id, 0]));
  for (const cable of patch.cables) incoming.set(cable.to.module, incoming.get(cable.to.module) + 1);
  const queue = patch.modules.filter(module => incoming.get(module.id) === 0).map(module => module.id);
  const result = [];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    result.push(id);
    for (const cable of patch.cables) {
      if (cable.from.module !== id) continue;
      incoming.set(cable.to.module, incoming.get(cable.to.module) - 1);
      if (incoming.get(cable.to.module) === 0) queue.push(cable.to.module);
    }
  }
  if (result.length !== patch.modules.length) throw new Error('Feedback loops are not supported yet.');
  return result;
}
export function validateCables(patch) {
  const occupied = new Set();
  const ids = new Set();
  for (const cable of patch.cables) {
    if (!cable || typeof cable.id !== 'string' || !cable.id || ids.has(cable.id)) throw new Error('Invalid cable ID.');
    ids.add(cable.id);
    getPort(patch, cable.from, 'output');
    getPort(patch, cable.to, 'input');
    const key = JSON.stringify([cable.to.module, cable.to.port]);
    if (occupied.has(key)) throw new Error('That input is already connected. Unplug its cable first.');
    occupied.add(key);
  }
  processingOrder(patch);
}
