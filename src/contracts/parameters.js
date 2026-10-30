export function validParameter(spec, value) {
  return Number.isFinite(value) && value >= spec.min && value <= spec.max
    && (!spec.integer || Number.isInteger(value))
    && (!spec.options || spec.options.some(option => option.value === value));
}
