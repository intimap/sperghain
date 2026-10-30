const NS = 'http://www.w3.org/2000/svg';
export function drawCables(svg, rack, patch, disconnect) {
  svg.replaceChildren();
  const bounds = rack.getBoundingClientRect();
  svg.setAttribute('width', rack.scrollWidth); svg.setAttribute('height', rack.clientHeight);
  const sockets = [...rack.querySelectorAll('.socket')];
  for (const socket of sockets) socket.classList.remove('connected');
  for (const [index, cable] of patch.cables.entries()) {
    const find = endpoint => sockets.find(socket => socket.dataset.module === endpoint.module && socket.dataset.port === endpoint.port);
    const start = find(cable.from), end = find(cable.to);
    if (!start || !end) continue;
    start.classList.add('connected'); end.classList.add('connected');
    const a = start.getBoundingClientRect(), b = end.getBoundingClientRect();
    const x1 = a.left + a.width / 2 - bounds.left, y1 = a.top + a.height / 2 - bounds.top;
    const x2 = b.left + b.width / 2 - bounds.left, y2 = b.top + b.height / 2 - bounds.top;
    const drop = Math.min(95, 40 + Math.abs(x2 - x1) * 0.12);
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', `M${x1},${y1} C${x1},${y1 + drop} ${x2},${y2 + drop} ${x2},${y2}`);
    path.setAttribute('stroke', ['#a4ebc1', '#f9a66d', '#c0a9ec'][index % 3]);
    path.setAttribute('tabindex', '0'); path.setAttribute('role', 'button'); path.setAttribute('aria-label', `Unplug cable ${index + 1}`);
    path.addEventListener('click', () => disconnect(cable.id));
    path.addEventListener('keydown', event => { if (['Enter', ' ', 'Delete'].includes(event.key)) { event.preventDefault(); disconnect(cable.id); } });
    svg.append(path);
  }
}
