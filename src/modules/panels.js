// UI registration stays outside the DSP registry and worklet dependency graph.
import { controls as clock } from './clock/panel.js';
import { controls as sequencer } from './sequencer/panel.js';
import { controls as dualOscSynth } from './dual-osc-synth/panel.js';
export const modulePanels = new Map([['clock', clock], ['sequencer', sequencer], ['dual-osc-synth', dualOscSynth]]);
