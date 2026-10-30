import test from 'node:test';
import assert from 'node:assert/strict';
import { registry, definition } from '../src/modules/registry.js';
import { Clock } from '../src/modules/clock/processor.js';
import { Sequencer } from '../src/modules/sequencer/processor.js';
import { compileGraph, renderGraph } from '../src/engine/graph.js';
import { validatePatch } from '../src/patches/validate.js';
import { RackStore } from '../src/rack/store.js';
import { DIVISIONS } from '../src/contracts/timing.js';
const params = type => Object.fromEntries(Object.entries(definition(type).parameters).map(([key, spec]) => [key, spec.default]));
const instance = (type, id = type) => ({ type, id, version: 1, parameters: params(type) });
const connect = (from, port, to, input) => ({ id: `${from}-${port}-${to}-${input}`, from: { module: from, port }, to: { module: to, port: input } });
function rig(extra = []) {
  const clock = instance('clock'); clock.parameters.running = 1;
  return { version: 1, modules: [clock, instance('sequencer'), ...extra], cables: [
    connect('clock', 'clock', 'sequencer', 'clock'),
    connect('clock', 'run', 'sequencer', 'run'),
    connect('clock', 'reset', 'sequencer', 'reset')
  ] };
}
function processFor(graph, frames, inspect = () => {}, block = 128) {
  const sink = new Float32Array(block);
  for (let offset = 0; offset < frames; offset += block) {
    const count = Math.min(block, frames - offset);
    renderGraph(graph, sink, count);
    inspect(graph, sink, count, offset);
  }
}
for (const rate of [44100, 48000]) {
  for (const bpm of [30, 120, 137, 300]) {
    test(`clock ${bpm} BPM at ${rate} Hz keeps sample timing over 8 seconds`, () => {
      const p = { ...params('clock'), bpm, running: 1 };
      const clock = new Clock(rate, p);
      const outputs = { clock: new Float32Array(127), run: new Float32Array(127), reset: new Float32Array(127) };
      let previous = false; const ticks = [];
      for (let offset = 0; offset < rate * 8; offset += 127) {
        const n = Math.min(127, rate * 8 - offset);
        clock.process({}, outputs, p, n);
        for (let i = 0; i < n; i++) {
          const high = outputs.clock[i] > 1;
          if (high && !previous) ticks.push(offset + i);
          previous = high;
        }
      }
      assert.equal(ticks.length, Math.ceil(8 * bpm * 24 / 60));
      ticks.forEach((position, index) => assert.ok(Math.abs(position - index * rate * 60 / (bpm * 24)) <= 1.01));
    });
  }
}
for (const { value, label } of DIVISIONS) {
  test(`${label} division advances and loops at the expected sample boundaries`, () => {
    const patch = rig(); patch.modules[1].parameters.division = value;
    patch.modules[1].parameters.length = 3;
    patch.modules[1].parameters.gate2 = 0;
    const rate = 48000; const graph = compileGraph(patch, rate);
    const duration = value * 1000;
    processFor(graph, duration * 7, (g, sink, n, offset) => {
      const out = g.nodes.get('sequencer').outputs;
      for (let i = 0; i < n; i++) {
        const step = Math.floor((offset + i) / duration) % 3;
        assert.equal(out.pitch[i], [0, 0.25, Math.fround(7 / 12)][step]);
        assert.equal(out.gate[i], step === 2 || ((offset + i) % duration) >= duration * 0.5 ? 0 : 5);
      }
    });
  });
}
test('two sequencers with different divisions stay phase aligned', () => {
  const second = instance('sequencer', 'second'); second.parameters.division = 12;
  const patch = rig([second]);
  for (const port of ['clock', 'run', 'reset']) patch.cables.push(connect('clock', port, 'second', port));
  const graph = compileGraph(validatePatch(patch), 48000);
  processFor(graph, 48000, (g, sink, n, offset) => {
    assert.equal(g.nodes.get('sequencer').processor.step, Math.floor((offset + n - 1) / 6000) % 8);
    assert.equal(g.nodes.get('second').processor.step, Math.floor((offset + n - 1) / 12000) % 8);
  });
});
test('stop silences gates; restart and reset select step one', () => {
  const graph = compileGraph(rig(), 48000); processFor(graph, 19000);
  const clock = graph.nodes.get('clock'); const seq = graph.nodes.get('sequencer');
  clock.parameters.running = 0; processFor(graph, 128);
  assert.ok(seq.outputs.gate.slice(0, 128).every(v => v === 0));
  clock.parameters.running = 1; processFor(graph, 1);
  assert.equal(seq.processor.step, 0); assert.equal(seq.outputs.gate[0], 5);
  processFor(graph, 16000); clock.parameters.reset++;
  processFor(graph, 1); assert.equal(seq.processor.step, 0); assert.equal(seq.outputs.pitch[0], 0);
});
test('sequencer requires clock edges; sustained high does not retrigger', () => {
  const seq = new Sequencer(48000); const p = params('sequencer');
  const inputs = { clock: new Float32Array(48000), run: new Float32Array(48000).fill(5), reset: new Float32Array(48000) };
  const outputs = { gate: new Float32Array(48000), pitch: new Float32Array(48000) };
  seq.process(inputs, outputs, p, 48000); assert.equal(seq.step, -1);
  inputs.clock.fill(5); seq.process(inputs, outputs, p, 48000);
  assert.equal(seq.step, 0); assert.equal(outputs.gate[47999], 0);
});
test('loop length one, pitch range and patch validation', () => {
  const patch = rig(); patch.modules[1].parameters.length = 1; patch.modules[1].parameters.pitch0 = -24;
  const graph = compileGraph(validatePatch(patch), 48000); processFor(graph, 20000);
  assert.equal(graph.nodes.get('sequencer').processor.step, 0);
  assert.equal(graph.nodes.get('sequencer').outputs.pitch[0], -2);
  assert.deepEqual(validatePatch(JSON.parse(JSON.stringify(patch))), patch);
  for (const [key, value] of [['division', 5], ['length', 2.5], ['pitch0', 1.5], ['gate0', 2]]) {
    const invalid = structuredClone(patch); invalid.modules[1].parameters[key] = value;
    assert.throws(() => validatePatch(invalid));
  }
});
test('UI store rejects non-integral or unsupported sequencer parameters', () => {
  const store = new RackStore(); store.load(rig());
  assert.throws(() => store.parameter('sequencer', 'division', 7));
  assert.throws(() => store.parameter('clock', 'bpm', 120.1));
});
test('tempo changes retain phase and length changes remain in range', () => {
  const graph = compileGraph(rig(), 48000); processFor(graph, 17000);
  graph.nodes.get('clock').parameters.bpm = 240;
  graph.nodes.get('sequencer').parameters.length = 2;
  processFor(graph, 10000);
  assert.ok(graph.nodes.get('sequencer').processor.step < 2);
  const oldProcessor = graph.nodes.get('sequencer').processor;
  const rebuilt = compileGraph(rig(), 48000, 2048, graph.nodes);
  assert.equal(rebuilt.nodes.get('sequencer').processor, oldProcessor);
});
test('legacy oscillator patches still sound; a patched low gate silences them', () => {
  const patch = { version: 1, modules: [instance('oscillator'), instance('output')], cables: [connect('oscillator', 'out', 'output', 'in')] };
  const graph = compileGraph(validatePatch(patch), 48000); const osc = graph.nodes.get('oscillator');
  let peak = 0; processFor(graph, 5000, (g, sink) => { peak = Math.max(peak, ...sink); }); assert.ok(peak > 0.49);
  osc.inputs.gate.fill(0); processFor(graph, 5000);
  assert.ok(osc.outputs.out.every(v => Math.abs(v) < 0.0001));
});
