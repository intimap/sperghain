import test from 'node:test';
import assert from 'node:assert/strict';
import { definition as synth } from '../src/modules/dual-osc-synth/definition.js';
import { definition } from '../src/modules/registry.js';
import { validatePatch } from '../src/patches/validate.js';
import { compileGraph, renderGraph } from '../src/engine/graph.js';
import { RackStore } from '../src/rack/store.js';
const instance = (type, id = type) => ({ id, type, version: 1, parameters: Object.fromEntries(Object.entries(definition(type).parameters).map(([key, spec]) => [key, spec.default])) });
const cable = (from, port, to, input, id = 'c') => ({ id, from: { module: from, port }, to: { module: to, port: input } });
const empty = modules => ({ version: 1, modules, cables: [] });
test('full DualOscSynth patch state round-trips using existing numeric enum validation', () => {
  const module = instance(synth.type);
  Object.assign(module.parameters, { waveform1: 2, waveform2: 0, mix: 0.17, attack: 0.023, decay: 0.31, sustain: 0.4, release: 0.81 });
  const patch = empty([module, instance('output')]);
  patch.cables.push(cable(module.id, 'out', 'output', 'in'));
  assert.deepEqual(validatePatch(JSON.parse(JSON.stringify(patch))), patch);
  const store = new RackStore(); store.load(patch);
  assert.deepEqual(store.patch, patch);
});
test('invalid waveform enums and ADSR values are rejected without new persistence logic', () => {
  for (const [key, value] of [['waveform1', 3], ['waveform2', 1.5], ['waveform1', 'saw'], ['mix', NaN], ['attack', 0], ['decay', 3], ['sustain', 1.1], ['release', 5]]) {
    const module = instance(synth.type); module.parameters[key] = value;
    assert.throws(() => validatePatch(empty([module])));
  }
});
test('unpatched graph produces a C3 voice; patched low gate is silent', () => {
  const patch = empty([instance(synth.type), instance('output'), instance('clock')]);
  patch.cables.push(cable(synth.type, 'out', 'output', 'in'));
  const graph = compileGraph(validatePatch(patch), 48000);
  const sink = new Float32Array(128);
  let peak = 0;
  for (let block = 0; block < 200; block++) {
    renderGraph(graph, sink, 128);
    for (const sample of sink) peak = Math.max(peak, Math.abs(sample));
  }
  assert.ok(peak > 0.1);
  assert.equal(graph.nodes.get(synth.type).processor.frequency, 130.81);
  patch.cables.push(cable('clock', 'run', synth.type, 'gate', 'g'));
  const mutedGraph = compileGraph(validatePatch(patch), 48000);
  renderGraph(mutedGraph, sink, 128);
  assert.ok(sink.every(sample => sample === 0));
});
test('clock/sequencer gates drive the new synth through the registered worklet graph', () => {
  const patch = empty(['clock', 'sequencer', synth.type, 'output'].map(type => instance(type)));
  patch.modules[0].parameters.running = 1;
  patch.modules[2].parameters.release = 0.001;
  patch.cables = [
    cable('clock', 'clock', 'sequencer', 'clock', 'c'),
    cable('clock', 'run', 'sequencer', 'run', 'r'),
    cable('clock', 'reset', 'sequencer', 'reset', 'reset'),
    cable('sequencer', 'gate', synth.type, 'gate', 'g'),
    cable('sequencer', 'pitch', synth.type, 'pitch', 'p'),
    cable(synth.type, 'out', 'output', 'in', 'a')
  ];
  const graph = compileGraph(validatePatch(patch), 48000);
  const sink = new Float32Array(1); let heard = false; let silent = false;
  for (let frame = 0; frame < 6000; frame++) {
    renderGraph(graph, sink, 1);
    if (frame > 500 && Math.abs(sink[0]) > 0.1) heard = true;
    if (frame > 4000 && sink[0] === 0) silent = true;
  }
  assert.ok(heard && silent);
});
test('new module reuses one-cable-per-input, cycle detection and 32-module cap', () => {
  const store = new RackStore(); store.add(synth.type); store.add(synth.type);
  const [first, second] = store.patch.modules;
  store.connect({ module: first.id, port: 'out' }, { module: second.id, port: 'pitch' });
  assert.throws(() => store.connect({ module: first.id, port: 'out' }, { module: second.id, port: 'pitch' }));
  assert.throws(() => store.connect({ module: second.id, port: 'out' }, { module: first.id, port: 'pitch' }));
  for (let i = 2; i < 32; i++) store.add(synth.type);
  assert.throws(() => store.add(synth.type));
  assert.equal(store.patch.modules.length, 32);
});
