import { DIVISIONS } from '../../contracts/timing.js';
const steps = {};
for (let step = 0; step < 8; step++) {
  steps[`pitch${step}`] = { label: `Step ${step + 1} pitch`, min: -24, max: 24, default: [0, 3, 7, 10, 12, 10, 7, 3][step], integer: true, unit: 'st' };
  steps[`gate${step}`] = { label: `Step ${step + 1} gate`, min: 0, max: 1, default: 1, integer: true };
}
export const definition = {
  type: 'sequencer', version: 1, name: 'Step sequencer', short: 'SEQ—08',
  category: 'SEQUENCING', width: 510, accent: 'violet', symbol: '▤',
  description: 'Eight steps of pitch and gates. Patch a clock, choose a division, build a loop.',
  parameters: {
    division: { label: 'Division', min: 3, max: 96, default: 6, integer: true, options: DIVISIONS },
    length: { label: 'Steps', min: 1, max: 8, default: 8, integer: true },
    gateWidth: { label: 'Gate length', min: 0.05, max: 0.95, default: 0.5 },
    ...steps
  },
  ports: [
    { id: 'clock', label: '24 PPQN', direction: 'input', signal: 'gate' },
    { id: 'run', label: 'RUN', direction: 'input', signal: 'gate', default: 5 },
    { id: 'reset', label: 'RESET', direction: 'input', signal: 'gate' },
    { id: 'gate', label: 'GATE', direction: 'output', signal: 'gate' },
    { id: 'pitch', label: 'PITCH CV', direction: 'output', signal: 'cv' }
  ]
};
