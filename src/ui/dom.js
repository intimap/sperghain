export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function button(text, label, action) {
  const node = element('button', '', text);
  node.type = 'button'; node.setAttribute('aria-label', label); node.title = label;
  node.addEventListener('click', action); return node;
}
