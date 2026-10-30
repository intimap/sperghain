import { element } from './dom.js';
export function parameterInput(spec, value, change) {
  const label = element('label', 'compact-control');
  label.append(element('span', '', spec.label));
  const input = element(spec.options ? 'select' : 'input');
  input.setAttribute('aria-label', spec.label);
  if (spec.options) {
    for (const option of spec.options) {
      const node = element('option', '', option.label);
      node.value = option.value;
      input.append(node);
    }
  } else {
    input.type = 'number'; input.min = spec.min; input.max = spec.max;
    input.step = spec.integer ? 1 : 0.05;
  }
  input.value = value;
  const commit = () => {
    if (!input.checkValidity() || input.value === '') return false;
    const next = Number(input.value);
    if (next !== value) { value = next; change(value); }
    return true;
  };
  input.addEventListener('input', commit);
  input.addEventListener('change', () => { if (!commit()) input.value = value; });
  label.append(input); return label;
}
