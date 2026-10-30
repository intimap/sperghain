import { PPQN, HIGH_VOLTAGE } from '../../contracts/timing.js';
export class Clock {
  constructor(sampleRate, parameters) {
    this.sampleRate = sampleRate;
    this.phase = 0;
    this.wasRunning = false;
    this.lastReset = parameters.reset;
    this.resetRemaining = 0;
    this.tick = 0;
    this.running = false;
  }
  process(inputs, outputs, parameters, frames) {
    const running = parameters.running === 1;
    const reset = parameters.reset !== this.lastReset || (running && !this.wasRunning);
    const increment = parameters.bpm * PPQN / (60 * this.sampleRate);
    if (reset) {
      this.phase = 0;
      this.tick = 0;
      this.resetRemaining = Math.max(1, Math.round(this.sampleRate * 0.001));
    }
    this.lastReset = parameters.reset;
    this.running = running;
    for (let i = 0; i < frames; i++) {
      // The clock goes high immediately on start/reset; half-cycle pulses.
      outputs.clock[i] = running && this.phase < 0.5 ? HIGH_VOLTAGE : 0;
      outputs.run[i] = running ? HIGH_VOLTAGE : 0;
      outputs.reset[i] = this.resetRemaining > 0 ? HIGH_VOLTAGE : 0;
      if (this.resetRemaining > 0) this.resetRemaining--;
      if (running) {
        this.phase += increment;
        if (this.phase >= 1 - 1e-12) {
          this.phase = Math.max(0, this.phase - 1);
          this.tick = (this.tick + 1) % (PPQN * 4);
        }
      } else this.phase = 0;
    }
    this.wasRunning = running;
  }
  status() { return { beat: Math.floor(this.tick / PPQN) + 1, running: this.running }; }
}
