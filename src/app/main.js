import { paintTelemetry } from '../rack/telemetry.js';
import { RackStore } from '../rack/store.js';
import { mountRack } from '../rack/view.js';
import { mountBrowser } from '../ui/module-browser.js';
import { mountPatchFiles } from '../patches/files.js';
import { BrowserAudio } from '../platform/browser-audio.js';
const store = new RackStore();
const report = message => { document.querySelector('#message').textContent = message; };
const audioButton = document.querySelector('#audio');
const audio = new BrowserAudio(state => {
  const running = state === 'running';
  document.querySelector('#audio-state').textContent = running ? '● AUDIO ON' : state === 'error' ? '● AUDIO ERROR' : '● AUDIO OFF';
  document.querySelector('#audio-state').classList.toggle('active', running);
  audioButton.textContent = running ? 'Pause audio' : 'Enable audio ↗';
  if (state === 'error') report('The audio engine stopped. Reload the page to restart it.');
}, paintTelemetry);
store.subscribe((patch, kind) => audio.sync(patch, kind));
mountRack(store, report); mountBrowser(store, report); mountPatchFiles(store, report);
audioButton.onclick = async () => {
  audioButton.disabled = true;
  try {
    if (audio.context?.state === 'running') await audio.suspend();
    else { await audio.enable(store.patch); report('Audio enabled. Connect an oscillator to an output to hear it.'); }
  } catch (error) { report(`Audio could not start: ${error.message}`); }
  finally { audioButton.disabled = false; }
};
document.querySelector('#master').oninput = event => audio.setVolume(Number(event.target.value));
document.querySelector('#mute').onclick = event => {
  const muted = audio.toggleMute(); event.currentTarget.setAttribute('aria-pressed', String(muted)); event.currentTarget.textContent = muted ? 'Unmute' : 'Mute';
};
