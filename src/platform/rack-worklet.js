import { compileGraph, renderGraph } from '../engine/graph.js';
import { emptyPatch } from '../contracts/patch.js';
class RackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.graph = compileGraph(emptyPatch(), sampleRate);
    this.sink = new Float32Array(2048);
    this.port.onmessage = ({ data }) => {
      if (data.type === 'patch') this.graph = compileGraph(data.patch, sampleRate, 2048, this.graph.nodes);
      if (data.type === 'parameters') {
        for (const instance of data.modules) {
          const node = this.graph.nodes.get(instance.id);
          if (node) Object.assign(node.parameters, instance.parameters);
        }
      }
    };
  }
  process(inputs, outputs) {
    const channels = outputs[0];
    if (!channels?.length) return true;
    renderGraph(this.graph, this.sink, channels[0].length);
    for (const channel of channels) {
      for (let i = 0; i < channel.length; i++) channel[i] = Number.isFinite(this.sink[i]) ? Math.max(-1, Math.min(1, this.sink[i])) : 0;
    }
    return true;
  }
}
registerProcessor('sperghain-rack', RackProcessor);
