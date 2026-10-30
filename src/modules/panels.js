// UI registration stays outside the DSP registry and worklet dependency graph.
import { controls as clock } from './clock/panel.js';
import { controls as sequencer } from './sequencer/panel.js';
export const modulePanels = new Map([['clock', clock], ['sequencer', sequencer]]);
