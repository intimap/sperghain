import { DEFAULT_FREQUENCY } from './definition.js';
import { AdsrEnvelope } from './envelope.js';
import { WaveformBlend } from './waveforms.js';

// Host-independent DSP: the registry instantiates this inside the rack worklet.
export class DualOscSynth {
  constructor(sampleRate, parameters) {
    this.sampleRate = sampleRate;
    this.smoothing = 1 - Math.exp(-1 / (0.01 * sampleRate));
    this.frequency = DEFAULT_FREQUENCY;
    this.phase1 = 0;
    this.phase2 = 0;
    this.mix = parameters.mix;
    this.oscillator1 = new WaveformBlend(parameters.waveform1, this.smoothing);
    this.oscillator2 = new WaveformBlend(parameters.waveform2, this.smoothing);
    this.envelope = new AdsrEnvelope(sampleRate, parameters);
  }

  process(inputs, outputs, parameters, frames) {
    for (let i = 0; i < frames; i++) {
      // 0V (also the unpatched input default) is C3; +/-1V shifts an octave.
      const voltage = inputs.pitch?.[i] ?? 0;
      const cv = Number.isFinite(voltage) ? Math.max(-10, Math.min(10, voltage)) : 0;
      const targetFrequency = Math.min(this.sampleRate * 0.45, DEFAULT_FREQUENCY * 2 ** cv);
      this.frequency += (targetFrequency - this.frequency) * this.smoothing;
      this.mix += (parameters.mix - this.mix) * this.smoothing;
      const gate = (inputs.gate?.[i] ?? 5) >= 1;
      const amplitude = this.envelope.next(gate, parameters);
      const first = this.oscillator1.sample(this.phase1, parameters.waveform1);
      const second = this.oscillator2.sample(this.phase2, parameters.waveform2);
      outputs.out[i] = 5 * ((1 - this.mix) * first + this.mix * second) * amplitude;
      const increment = this.frequency / this.sampleRate;
      this.phase1 = (this.phase1 + increment) % 1;
      this.phase2 = (this.phase2 + increment) % 1;
    }
  }
}
