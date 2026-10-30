import { registry, definition } from '../modules/registry.js';
import { processingOrder } from '../patching/graph.js';
// Compilation happens only on graph changes; all buffers are reused per render block.
export function compileGraph(patch, sampleRate, capacity = 2048, previous = new Map()) {
  const nodes = new Map();
  for (const instance of patch.modules) {
    const spec = definition(instance.type);
    const prior = previous.get(instance.id);
    nodes.set(instance.id, {
      id: instance.id, type: instance.type, parameters: { ...instance.parameters },
      processor: prior?.type === instance.type ? prior.processor : new (registry.get(instance.type).Processor)(sampleRate, instance.parameters),
      inputs: Object.fromEntries(spec.ports.filter(p => p.direction === 'input').map(p => [p.id, new Float32Array(capacity)])),
      outputs: Object.fromEntries(spec.ports.filter(p => p.direction === 'output').map(p => [p.id, new Float32Array(capacity)]))
    });
  }
  for (const cable of patch.cables) nodes.get(cable.to.module).inputs[cable.to.port] = nodes.get(cable.from.module).outputs[cable.from.port];
  return { nodes, ordered: processingOrder(patch).map(id => nodes.get(id)), capacity };
}
export function renderGraph(graph, sink, frames) {
  sink.fill(0, 0, frames);
  if (frames > graph.capacity) return;
  for (const node of graph.ordered) node.processor.process(node.inputs, node.outputs, node.parameters, frames, sink);
}
