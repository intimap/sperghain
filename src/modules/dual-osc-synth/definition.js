export const DEFAULT_FREQUENCY = 130.81;
// Numeric waveform enums are persisted by the existing patch format.
export const WAVEFORMS = [
  { value: 0, label: 'Sine' },
  { value: 1, label: 'Saw' },
  { value: 2, label: 'Square' }
];
export const definition = {
  type: 'dual-osc-synth',
  version: 1,
  name: 'DualOscSynth',
  short: 'DUAL—01',
  category: 'SYNTH VOICE',
  width: 590,
  accent: 'mint',
  symbol: '∿',
  description: 'Two waveforms, one pitch and a built-in ADSR. From a pure tone to a sequenced voice.',
  parameters: {
    waveform1: { label: 'Osc 1 waveform', min: 0, max: 2, default: 1, integer: true, options: WAVEFORMS },
    waveform2: { label: 'Osc 2 waveform', min: 0, max: 2, default: 2, integer: true, options: WAVEFORMS },
    mix: { label: 'Mix', min: 0, max: 1, default: 0.5, scale: 'linear' },
    attack: { label: 'Attack', min: 0.001, max: 2, default: 0.01, unit: 's', scale: 'log' },
    decay: { label: 'Decay', min: 0.001, max: 2, default: 0.15, unit: 's', scale: 'log' },
    sustain: { label: 'Sustain', min: 0, max: 1, default: 0.7, scale: 'linear' },
    release: { label: 'Release', min: 0.001, max: 4, default: 0.3, unit: 's', scale: 'log' }
  },
  ports: [
    { id: 'gate', label: 'GATE', direction: 'input', signal: 'gate', default: 5 },
    { id: 'pitch', label: '1V/OCT', direction: 'input', signal: 'cv' },
    { id: 'out', label: 'AUDIO OUT', direction: 'output', signal: 'audio' }
  ]
};
