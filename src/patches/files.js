export function mountPatchFiles(store, report) {
  const picker = document.querySelector('#patch-file');
  document.querySelector('#save').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(store.patch, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'sperghain-patch.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); report('Patch saved to your downloads.');
  };
  document.querySelector('#load').onclick = () => picker.click();
  picker.onchange = async () => {
    const file = picker.files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Patch file is too large.');
      const patch = JSON.parse(await file.text());
      store.load(patch); report('Patch loaded.');
    } catch (error) { report(`Could not load patch: ${error.message}`); }
    picker.value = '';
  };
}
