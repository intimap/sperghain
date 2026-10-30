export function waveform(phase, choice) {
  // TODO: band-limit saw/square (e.g. PolyBLEP or mipmapped wavetables).
  // The existing sine oscillator has no band-limiting infrastructure.
  // These naïve discontinuous waves can alias, especially at high pitches.
  if (choice === 1) return 2 * phase - 1;
  if (choice === 2) return phase < 0.5 ? 1 : -1;
  return Math.sin(phase * Math.PI * 2);
}

export class WaveformBlend {
  constructor(choice, smoothing) {
    this.weights = new Float64Array(3);
    this.weights[choice] = 1;
    this.smoothing = smoothing;
  }

  sample(phase, choice) {
    let value = 0;
    for (let index = 0; index < 3; index++) {
      const target = index === choice ? 1 : 0;
      this.weights[index] += (target - this.weights[index]) * this.smoothing;
      value += this.weights[index] * waveform(phase, index);
    }
    return value;
  }
}
