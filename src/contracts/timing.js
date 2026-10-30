// Shared wire protocol. Any sequencing module can consume these signals.
export const PPQN = 24;
export const HIGH_VOLTAGE = 5;
export const EDGE_THRESHOLD = 1;
export const DIVISIONS = [
  { value: 96, label: '1/1' }, { value: 48, label: '1/2' },
  { value: 24, label: '1/4' }, { value: 12, label: '1/8' },
  { value: 6, label: '1/16' }, { value: 3, label: '1/32' }
];
// 0V is the receiving oscillator's base pitch; semitones map to 1V/octave.
export const semitonesToVolts = semitones => semitones / 12;
