export class Output {
  constructor(sampleRate, parameters) {
    this.level = parameters.level;
    this.smoothing = 1 - Math.exp(-1 / (0.01 * sampleRate));
  }
  process(inputs, outputs, parameters, frames, sink) {
    for (let i = 0; i < frames; i++) {
      this.level += (parameters.level - this.level) * this.smoothing;
      sink[i] += inputs.in[i] * 0.2 * this.level;
    }
  }
}
