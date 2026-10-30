import { EDGE_THRESHOLD, HIGH_VOLTAGE, semitonesToVolts } from '../../contracts/timing.js';
export class Sequencer {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.step = -1;
    this.pulses = 0;
    this.previousClock = false;
    this.previousReset = false;
    this.previousRun = false;
    this.gateOpen = false;
    this.age = 0;
    this.tickAge = 0;
    this.tickPeriod = 0;
    this.haveTick = false;
    this.pitch = 0;
    this.division = 6;
  }
  reset() {
    this.step = -1;
    this.pulses = 0;
    this.gateOpen = false;
    this.haveTick = false;
    this.tickPeriod = 0;
    this.tickAge = 0;
  }
  process(inputs, outputs, parameters, frames) {
    for (let i = 0; i < frames; i++) {
      const clock = inputs.clock[i] >= EDGE_THRESHOLD;
      const reset = inputs.reset[i] >= EDGE_THRESHOLD;
      const run = inputs.run[i] >= EDGE_THRESHOLD;
      const resetEdge = reset && !this.previousReset;
      const start = run && !this.previousRun;
      if (resetEdge || start) this.reset();
      // A reset on a clock edge selects step 1 exactly once, not step 2.
      const edge = clock && (!this.previousClock || resetEdge || start);
      if (!run) this.gateOpen = false;
      if (run && edge) {
        if (this.haveTick) this.tickPeriod = this.tickAge;
        this.tickAge = 0;
        this.haveTick = true;
        if (this.step < 0 || ++this.pulses >= this.division) {
          this.step = (this.step + 1) % parameters.length;
          this.pulses = 0;
          this.division = parameters.division;
          this.age = 0;
          this.pitch = semitonesToVolts(parameters[`pitch${this.step}`]);
          this.gateOpen = parameters[`gate${this.step}`] === 1;
        }
      }
      // Division changes latch at the next step. Pitch is held across rests/stops.
      if (this.gateOpen) {
        const duration = this.tickPeriod > 0
          ? this.tickPeriod * this.division * parameters.gateWidth
          : this.sampleRate * 0.1;
        if (this.age >= duration) this.gateOpen = false;
      }
      outputs.gate[i] = this.gateOpen ? HIGH_VOLTAGE : 0;
      outputs.pitch[i] = this.pitch;
      this.age++;
      this.tickAge++;
      this.previousClock = clock;
      this.previousReset = reset;
      this.previousRun = run;
    }
  }
  status() {
    const receivingClock = this.haveTick && this.tickAge < (this.tickPeriod || this.sampleRate * 0.1) * 2;
    return { step: this.step, running: this.previousRun && receivingClock, gate: this.gateOpen };
  }
}
