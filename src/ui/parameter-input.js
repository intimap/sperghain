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
  input.addEventListener('change', () => {
    if (!input.checkValidity() || input.value === '') { input.value = value; return; }
    value = Number(input.value);
    change(value);
  });
  label.append(input); return label;
}
