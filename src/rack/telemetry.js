// Audio-thread state is polled for display only. This never schedules sound.
export function paintTelemetry(items) {
  for (const item of items) {
    const panel = document.querySelector(`[data-module="${item.id}"].module`);
    if (!panel) continue;
    const display = panel.querySelector('[data-status]');
    if (!display) continue;
    if (display.dataset.status === 'clock') {
      display.textContent = item.state.running ? `RUNNING · BEAT ${item.state.beat}` : 'STOPPED';
    } else {
      display.textContent = item.state.running ? `STEP ${item.state.step + 1} · ${item.state.gate ? 'GATE HIGH' : 'GATE LOW'}` : 'WAITING FOR CLOCK';
      panel.querySelectorAll('[data-step]').forEach(cell => {
        const active = item.state.running && Number(cell.dataset.step) === item.state.step;
        cell.classList.toggle('playing', active);
        cell.setAttribute('aria-current', active ? 'step' : 'false');
      });
    }
  }
}
