export class BrowserAudio {
  constructor(onState) { this.onState = onState; this.volume = 0.25; this.muted = false; }
  async enable(patch) {
    if (!globalThis.isSecureContext) throw new Error('Audio needs HTTPS or localhost. Rack editing still works.');
    if (!this.context) {
      const context = new AudioContext({ latencyHint: 'interactive' });
      try {
        await context.audioWorklet.addModule(new URL('./rack-worklet.js', import.meta.url));
        this.node = new AudioWorkletNode(context, 'sperghain-rack', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
        this.gain = context.createGain();
        this.gain.gain.value = this.muted ? 0 : this.volume;
        this.node.connect(this.gain).connect(context.destination);
        this.node.onprocessorerror = () => { this.gain.gain.value = 0; this.onState('error'); };
        this.context = context;
        context.onstatechange = () => this.onState(context.state);
      } catch (error) { await context.close(); throw error; }
    }
    this.sync(patch);
    await this.context.resume();
    this.onState(this.context.state);
  }
  async suspend() { await this.context?.suspend(); }
  sync(patch, kind = 'graph') {
    if (kind === 'layout') return;
    this.node?.port.postMessage(kind === 'parameter' ? { type: 'parameters', modules: patch.modules } : { type: 'patch', patch });
  }
  setVolume(value) { this.volume = value; this.updateGain(); }
  toggleMute() { this.muted = !this.muted; this.updateGain(); return this.muted; }
  updateGain() {
    if (this.context) this.gain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, 0.015);
  }
}
