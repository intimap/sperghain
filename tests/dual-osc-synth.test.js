import test from 'node:test';
import assert from 'node:assert/strict';
import { definition, DEFAULT_FREQUENCY } from '../src/modules/dual-osc-synth/definition.js';
import { DualOscSynth } from '../src/modules/dual-osc-synth/processor.js';
import { AdsrEnvelope } from '../src/modules/dual-osc-synth/envelope.js';

const defaults = () => Object.fromEntries(Object.entries(definition.parameters).map(([key, spec]) => [key, spec.default]));
const steady = () => ({ ...defaults(), waveform1: 0, waveform2: 0, mix: 0, attack: 0.001, decay: 0.001, sustain: 1 });
function render(processor, parameters, frames, pitch, gate) {
  const inputs = {};
  if (pitch !== undefined) inputs.pitch = new Float32Array(frames).fill(pitch);
  if (gate !== undefined) inputs.gate = new Float32Array(frames).fill(gate);
  const output = new Float32Array(frames);
  processor.process(inputs, { out: output }, parameters, frames);
  return output;
}
function measuredFrequency(samples, rate, skip) {
  const crossings = [];
  for (let i = skip + 1; i < samples.length; i++) {
    if (samples[i - 1] <= 0 && samples[i] > 0) {
      crossings.push(i - 1 - samples[i - 1] / (samples[i] - samples[i - 1]));
    }
  }
  return (crossings.length - 1) * rate / (crossings.at(-1) - crossings[0]);
}
for (const rate of [44100, 48000]) {
  for (const cv of [undefined, 0, 1, -1]) {
    test(`${rate}Hz: ${cv === undefined ? 'unpatched pitch' : `${cv}V`} tracks C3-relative 1V/oct`, () => {
      const parameters = steady();
      const processor = new DualOscSynth(rate, parameters);
      const samples = render(processor, parameters, Math.round(rate * 1.2), cv);
      const expected = 130.81 * 2 ** (cv ?? 0);
      assert.ok(Math.abs(measuredFrequency(samples, rate, Math.round(rate * 0.2)) - expected) < 0.01);
      assert.ok(Math.abs(processor.frequency - expected) < 1e-6);
    });
  }
  test(`${rate}Hz: attack, decay, sustain and release reach their timed targets`, () => {
    const parameters = { ...defaults(), attack: 0.02, decay: 0.04, sustain: 0.35, release: 0.06 };
    const env = new AdsrEnvelope(rate, parameters);
    const attackFrames = Math.round(rate * parameters.attack);
    for (let i = 0; i < attackFrames / 2; i++) env.next(true, parameters);
    assert.ok(Math.abs(env.level - 0.5) < 1e-10);
    for (let i = attackFrames / 2; i < attackFrames; i++) env.next(true, parameters);
    assert.equal(env.level, 1);
    assert.equal(env.stage, 'decay');
    for (let i = 0; i < Math.round(rate * parameters.decay); i++) env.next(true, parameters);
    assert.equal(env.stage, 'sustain');
    assert.ok(Math.abs(env.level - parameters.sustain) < 1e-12);
    for (let i = 0; i < rate; i++) assert.equal(env.next(true, parameters), parameters.sustain);
    const releaseFrames = Math.round(rate * parameters.release);
    for (let i = 0; i < releaseFrames / 2; i++) env.next(false, parameters);
    assert.ok(Math.abs(env.level - parameters.sustain / 2) < 1e-10);
    for (let i = releaseFrames / 2; i < releaseFrames; i++) env.next(false, parameters);
    assert.equal(env.level, 0);
    assert.equal(env.stage, 'idle');
  });
}
test('Osc 2 tracks the same pitch CV when selected by the mix', () => {
  const parameters = { ...steady(), mix: 1 };
  const processor = new DualOscSynth(48000, parameters);
  const samples = render(processor, parameters, 48000, 1);
  assert.ok(Math.abs(measuredFrequency(samples, 48000, 9600) - 261.62) < 0.01);
  assert.equal(DEFAULT_FREQUENCY, 130.81);
});
test('gate low is silent; release envelope is applied to the actual audio', () => {
  const parameters = steady(); parameters.release = 0.02;
  const processor = new DualOscSynth(48000, parameters);
  assert.ok(render(processor, parameters, 512, 0, 0).every(sample => sample === 0));
  assert.ok(render(processor, parameters, 1024, 0, 5).some(sample => Math.abs(sample) > 4.9));
  const tail = render(processor, parameters, 2048, 0, 0);
  assert.ok(tail.slice(0, 800).some(sample => Math.abs(sample) > 0.1));
  assert.ok(tail.slice(960).every(sample => sample === 0));
});
test('unpatched gate opens the envelope and both oscillators stay within ±5V', () => {
  const parameters = defaults();
  const processor = new DualOscSynth(48000, parameters);
  const samples = render(processor, parameters, 48000);
  assert.equal(processor.envelope.stage, 'sustain');
  assert.equal(processor.envelope.level, parameters.sustain);
  assert.ok(samples.some(sample => Math.abs(sample) > 1));
  assert.ok(samples.every(sample => Number.isFinite(sample) && Math.abs(sample) <= 5));
});
test('retriggers during release and sustain preserve level continuity', () => {
  const parameters = { ...defaults(), attack: 0.01, decay: 0.01, release: 0.02 };
  const env = new AdsrEnvelope(48000, parameters);
  for (let i = 0; i < 1024; i++) env.next(true, parameters);
  assert.equal(env.stage, 'sustain');
  const held = env.level;
  env.next(false, parameters);
  const beforeRetrigger = env.level;
  env.next(true, parameters);
  assert.equal(env.stage, 'attack');
  assert.ok(Math.abs(env.level - beforeRetrigger) < 0.003);
  assert.ok(env.level > held * 0.99);
  for (let i = 0; i < 100; i++) env.next(false, parameters);
  const tail = env.level;
  env.next(true, parameters);
  assert.ok(env.level >= tail && env.level - tail < 0.003);
});
test('gate release during attack and rapid gate pulses remain finite and bounded', () => {
  const parameters = defaults();
  const env = new AdsrEnvelope(48000, parameters);
  env.next(true, parameters);
  const peak = env.level;
  env.next(false, parameters);
  assert.equal(env.stage, 'release');
  assert.ok(env.level < peak);
  for (let i = 0; i < 10000; i++) {
    const value = env.next(i % 3 === 0, parameters);
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
  }
});
test('each oscillator has independent sine/saw/square selection', () => {
  for (const mix of [0, 1]) {
    const samples = [];
    for (const choice of [0, 1, 2]) {
      const parameters = { ...steady(), mix, waveform1: choice, waveform2: choice };
      const processor = new DualOscSynth(48000, parameters);
      render(processor, parameters, 2048);
      samples.push(render(processor, parameters, 400));
    }
    assert.equal(new Set(samples[2]).size, 2);
    assert.ok(new Set(samples[0]).size > 300);
    assert.ok(new Set(samples[1]).size > 300);
    assert.notDeepEqual(samples[0], samples[1]);
    assert.notDeepEqual(samples[1], samples[2]);
    const maximumSineDelta = samples[0].slice(1).reduce((max, sample, i) => Math.max(max, Math.abs(sample - samples[0][i])), 0);
    assert.ok(maximumSineDelta < 0.1);
  }
});
test('mix endpoints isolate each oscillator and midpoint is a linear crossfade', () => {
  const results = [0, 0.5, 1].map(mix => {
    const parameters = { ...steady(), waveform1: 0, waveform2: 2, mix };
    return render(new DualOscSynth(48000, parameters), parameters, 2048);
  });
  for (let i = 0; i < results[0].length; i++) {
    assert.ok(Math.abs(results[1][i] - (results[0][i] + results[2][i]) / 2) < 1e-6);
  }
  assert.notDeepEqual(results[0], results[2]);
});
test('frequency, mix and every ADSR control use 10ms smoothing', () => {
  const parameters = steady();
  const processor = new DualOscSynth(48000, parameters);
  render(processor, parameters, 2000, 0, 5);
  const before = { mix: processor.mix, attack: processor.envelope.attack, decay: processor.envelope.decay, sustain: processor.envelope.sustain, release: processor.envelope.release };
  Object.assign(parameters, { mix: 1, attack: 0.2, decay: 0.4, sustain: 0, release: 0.9 });
  render(processor, parameters, 1, 1, 5);
  const alpha = 1 - Math.exp(-1 / 480);
  assert.ok(Math.abs(processor.frequency - (130.81 + 130.81 * alpha)) < 1e-10);
  assert.ok(Math.abs(processor.mix - (before.mix + (1 - before.mix) * alpha)) < 1e-12);
  for (const key of ['attack', 'decay', 'sustain', 'release']) {
    const expected = before[key] + (parameters[key] - before[key]) * alpha;
    assert.ok(Math.abs(processor.envelope[key] - expected) < 1e-12);
  }
  render(processor, parameters, 10000, 1, 5);
  assert.ok(Math.abs(processor.frequency - 261.62) < 1e-5);
  assert.ok(processor.mix > 0.999);
});
test('waveform switches crossfade instead of instantly replacing their shape', () => {
  const parameters = steady();
  const processor = new DualOscSynth(48000, parameters);
  render(processor, parameters, 1000);
  parameters.waveform1 = 2;
  render(processor, parameters, 1);
  assert.ok(processor.oscillator1.weights[0] > 0.99);
  assert.ok(processor.oscillator1.weights[2] > 0 && processor.oscillator1.weights[2] < 0.01);
});
test('render result is independent of audio block boundaries', () => {
  const parameters = defaults(); const frames = 4096;
  const whole = render(new DualOscSynth(48000, parameters), parameters, frames, 0.25, 5);
  const processor = new DualOscSynth(48000, parameters); const blocked = new Float32Array(frames);
  for (let offset = 0; offset < frames; offset += 128) blocked.set(render(processor, parameters, 128, 0.25, 5), offset);
  assert.deepEqual(blocked, whole);
});
