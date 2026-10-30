import test from 'node:test';
import assert from 'node:assert/strict';
import { Oscillator } from '../src/modules/oscillator/processor.js';
import { compileGraph, renderGraph } from '../src/engine/graph.js';
import { validatePatch } from '../src/patches/validate.js';
import { RackStore } from '../src/rack/store.js';
const osc = (id = 'osc') => ({ id, type: 'oscillator', version: 1, parameters: { frequency: 220 } });
const out = (id = 'out') => ({ id, type: 'output', version: 1, parameters: { level: 0.5 } });
const cable = (from = 'osc', to = 'out', port = 'in', id = 'c1') => ({ id, from: { module: from, port: 'out' }, to: { module: to, port } });
const patch = (modules = [osc(), out()], cables = [cable()]) => ({ version: 1, modules, cables });

for (const rate of [44100, 48000]) {
  test(`sine produces 220Hz at ${rate}Hz, with nominal ±5V amplitude`, () => {
    const processor = new Oscillator(rate, { frequency: 220 });
    const output = new Float32Array(rate);
    processor.process({ pitch: new Float32Array(rate) }, { out: output }, { frequency: 220 }, rate);
    let crossings = 0;
    for (let i = 1; i < output.length; i++) if (output[i - 1] <= 0 && output[i] > 0) crossings++;
    assert.equal(crossings, 220);
    assert.ok(Math.max(...output) > 4.99 && Math.max(...output) <= 5);
  });
}
test('+1V doubles pitch to 440Hz', () => {
  const p = new Oscillator(48000, { frequency: 220 });
  const output = new Float32Array(48000);
  p.process({ pitch: new Float32Array(48000).fill(1) }, { out: output }, { frequency: 220 }, 48000);
  let crossings = 0;
  for (let i = 1; i < output.length; i++) if (output[i - 1] <= 0 && output[i] > 0) crossings++;
  assert.equal(crossings, 440);
});
test('connected graph produces audio regardless of rack order', () => {
  const graph = compileGraph(patch([out(), osc()]), 48000);
  const sink = new Float32Array(128); renderGraph(graph, sink, 128);
  assert.ok(sink.some(v => Math.abs(v) > 0.1));
  assert.ok(sink.every(v => Math.abs(v) <= 0.5));
});
test('empty and disconnected racks are silent', () => {
  for (const value of [patch([], []), patch([osc(), out()], [])]) {
    const sink = new Float32Array(128).fill(1);
    renderGraph(compileGraph(value, 48000), sink, 128);
    assert.ok(sink.every(v => v === 0));
  }
});
test('output fan-out works and sums destinations', () => {
  const graph = compileGraph(validatePatch(patch([osc(), out(), out('out2')], [cable(), cable('osc', 'out2', 'in', 'c2')])), 48000);
  const sink = new Float32Array(128); renderGraph(graph, sink, 128);
  for (let i = 0; i < 50; i++) renderGraph(graph, sink, 128);
  const signal = graph.nodes.get('osc').outputs.out;
  for (let i = 0; i < sink.length; i++) assert.ok(Math.abs(sink[i] - signal[i] * 0.2) < 1e-6);
});
test('reject cycles, occupied inputs, missing endpoints and wrong port direction', () => {
  for (const value of [
    patch([osc(), osc('osc2')], [cable('osc', 'osc2', 'pitch'), cable('osc2', 'osc', 'pitch', 'c2')]),
    patch([osc(), out()], [cable(), cable('osc', 'out', 'in', 'c2')]),
    patch([out()]),
    patch([osc(), out()], [{ ...cable(), from: { module: 'out', port: 'in' } }])
  ]) assert.throws(() => validatePatch(value));
});
test('reject malformed, unknown and non-finite patch data', () => {
  for (const value of [null, {}, { ...patch(), version: 99 }, patch([{ ...osc(), type: 'unknown' }], []), patch([{ ...osc(), parameters: { frequency: NaN } }], []), patch([osc(), osc()], []), patch([osc()], [null])]) {
    assert.throws(() => validatePatch(value));
  }
});
test('patch serialization preserves the signal graph and module settings', () => {
  const source = patch(); source.modules[0].parameters.frequency = 440;
  assert.deepEqual(validatePatch(JSON.parse(JSON.stringify(source))), source);
});
test('removing a module removes cables and silences output', () => {
  const store = new RackStore(); store.load(patch()); store.remove('osc');
  assert.equal(store.patch.cables.length, 0);
  const sink = new Float32Array(128); renderGraph(compileGraph(store.patch, 48000), sink, 128);
  assert.ok(sink.every(v => v === 0));
});
test('processors retain phase through graph edits; instances are independent', () => {
  const original = compileGraph(patch(), 48000);
  renderGraph(original, new Float32Array(128), 128);
  const next = compileGraph(patch([osc(), osc('osc2'), out()]), 48000, 2048, original.nodes);
  assert.equal(next.nodes.get('osc').processor, original.nodes.get('osc').processor);
  assert.notEqual(next.nodes.get('osc2').processor, next.nodes.get('osc').processor);
  assert.equal(next.nodes.get('osc2').processor.phase, 0);
});
test('invalid imported patch does not replace current rack', () => {
  const store = new RackStore(); store.load(patch());
  const before = structuredClone(store.patch);
  assert.throws(() => store.load({ version: 99 }));
  assert.deepEqual(store.patch, before);
});
