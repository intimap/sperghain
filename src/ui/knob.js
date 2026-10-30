import { element } from './dom.js';
export function knob(spec, initial, change) {
  const wrap = element('label', 'knob-control');
  const title = element('span', 'control-label', spec.label);
  const dial = element('span', 'dial');
  const marker = element('span', 'dial-marker'); dial.append(marker);
  const value = element('span', 'control-value');
  const input = element('input'); input.type = 'range'; input.min = 0; input.max = 1000; input.step = 1;
  input.setAttribute('aria-label', spec.label);
  const toPosition = v => spec.scale === 'log' ? Math.log(v / spec.min) / Math.log(spec.max / spec.min) : (v - spec.min) / (spec.max - spec.min);
  const toValue = p => spec.scale === 'log' ? spec.min * (spec.max / spec.min) ** p : spec.min + p * (spec.max - spec.min);
  const paint = v => {
    input.value = Math.round(toPosition(v) * 1000);
    marker.style.transform = `rotate(${-135 + toPosition(v) * 270}deg)`;
    value.textContent = `${spec.unit === 'Hz' ? Math.round(v) : Math.round(v * 100)} ${spec.unit || '%'}`;
    input.setAttribute('aria-valuetext', value.textContent);
  };
  input.addEventListener('input', () => { const v = toValue(Number(input.value) / 1000); paint(v); change(v); });
  input.addEventListener('dblclick', () => { paint(spec.default); change(spec.default); });
  wrap.append(title, dial, value, input); paint(initial); return wrap;
}
