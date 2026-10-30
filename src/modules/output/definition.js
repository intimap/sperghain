export const definition = {
  type: 'output', version: 1, name: 'Stereo output', short: 'OUT—01', category: 'DESTINATION', width: 200,
  description: 'From virtual voltage to your speakers. The end of the chain.', accent: 'orange',
  parameters: { level: { label: 'Level', min: 0, max: 1, default: 0.5, unit: '', scale: 'linear' } },
  ports: [ { id: 'in', label: 'AUDIO IN', direction: 'input', signal: 'audio' } ]
};
