export class Oscillator {
  constructor(sampleRate, parameters) {
    this.sampleRate = sampleRate;
    this.phase = 0;
    this.amplitude = 0;
    this.gateSmoothing = 1 - Math.exp(-1 / (0.002 * sampleRate));
    this.frequency = parameters.frequency;
    this.smoothing = 1 - Math.exp(-1 / (0.01 * sampleRate));
  }
  process(inputs, outputs, parameters, frames) {
    for (let i = 0; i < frames; i++) {
      this.frequency += (parameters.frequency - this.frequency) * this.smoothing;
      const frequency = Math.min(this.sampleRate * 0.45, this.frequency * 2 ** Math.max(-10, Math.min(10, inputs.pitch[i])));
      const target = !inputs.gate || inputs.gate[i] >= 1 ? 1 : 0;
      this.amplitude += (target - this.amplitude) * this.gateSmoothing;
      outputs.out[i] = Math.sin(this.phase * Math.PI * 2) * 5 * this.amplitude;
      this.phase = (this.phase + frequency / this.sampleRate) % 1;
    }
  }
}
