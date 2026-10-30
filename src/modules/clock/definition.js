export const definition = {
  type: 'clock', version: 1, name: 'Master clock', short: 'CLK—01',
  category: 'TIMING', width: 250, accent: 'mint', symbol: '▦',
  description: 'One tempo for the whole rack. Start, stop and reset in sync.',
  parameters: {
    bpm: { label: 'Tempo', min: 30, max: 300, default: 120, unit: 'BPM', integer: true },
    running: { label: 'Run', min: 0, max: 1, default: 0, integer: true },
    reset: { label: 'Reset counter', min: 0, max: 65535, default: 0, integer: true }
  },
  ports: [
    { id: 'clock', label: '24 PPQN', direction: 'output', signal: 'gate' },
    { id: 'run', label: 'RUN', direction: 'output', signal: 'gate' },
    { id: 'reset', label: 'RESET', direction: 'output', signal: 'gate' }
  ]
};
