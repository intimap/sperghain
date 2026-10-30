// Linear ADSR segments, with the project's 10ms one-pole parameter smoothing.
// Progress integrates smoothed times, so changing a time never jumps the level.
export class AdsrEnvelope {
  constructor(sampleRate, parameters) {
    this.sampleRate = sampleRate;
    this.smoothing = 1 - Math.exp(-1 / (0.01 * sampleRate));
    this.attack = parameters.attack;
    this.decay = parameters.decay;
    this.sustain = parameters.sustain;
    this.release = parameters.release;
    this.stage = 'idle';
    this.level = 0;
    this.progress = 0;
    this.startLevel = 0;
    this.gateHigh = false;
  }

  enter(stage) {
    this.stage = stage;
    this.progress = 0;
    this.startLevel = this.level;
  }

  next(gate, parameters) {
    this.attack += (parameters.attack - this.attack) * this.smoothing;
    this.decay += (parameters.decay - this.decay) * this.smoothing;
    this.sustain += (parameters.sustain - this.sustain) * this.smoothing;
    this.release += (parameters.release - this.release) * this.smoothing;

    // Retrigger from the current level, including during a release tail.
    if (gate && !this.gateHigh) this.enter('attack');
    else if (!gate && this.gateHigh) this.enter('release');
    this.gateHigh = gate;

    switch (this.stage) {
      case 'attack':
        this.progress += 1 / (this.attack * this.sampleRate);
        this.level = this.startLevel + (1 - this.startLevel) * Math.min(1, this.progress);
        if (this.progress >= 1 - 1e-12) {
          this.level = 1;
          this.enter('decay');
        }
        break;
      case 'decay':
        this.progress += 1 / (this.decay * this.sampleRate);
        this.level = 1 + (this.sustain - 1) * Math.min(1, this.progress);
        if (this.progress >= 1 - 1e-12) {
          this.level = this.sustain;
          this.enter('sustain');
        }
        break;
      case 'sustain':
        this.level = this.sustain;
        break;
      case 'release':
        this.progress += 1 / (this.release * this.sampleRate);
        this.level = this.startLevel * Math.max(0, 1 - this.progress);
        if (this.progress >= 1 - 1e-12) {
          this.level = 0;
          this.enter('idle');
        }
        break;
      default:
        this.level = 0;
    }
    return this.level;
  }
}
