export const definition = {
  type: 'oscillator', version: 1, name: 'Sine oscillator', short: 'OSC—01', category: 'SOURCE', width: 240,
  description: 'A pure sine wave. The first spark in your signal chain.', accent: 'mint',
  parameters: { frequency: { label: 'Frequency', min: 20, max: 2000, default: 220, unit: 'Hz', scale: 'log' } },
  ports: [ { id: 'pitch', label: '1V/OCT', direction: 'input', signal: 'cv' }, { id: 'out', label: 'SINE', direction: 'output', signal: 'audio' } ]
};
